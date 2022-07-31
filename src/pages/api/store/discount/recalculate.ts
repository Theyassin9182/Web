import { NextApiResponse } from "next";
import { CartItem } from "src/pages/store";
import { DiscountItem } from "src/pages/store/checkout";
import CartController from "src/util/cart/controller";
import { calculateDiscount } from "src/util/discounts";
import { getSelectedPriceValue } from "src/util/store/index";
import { stripeConnect } from "src/util/stripe";
import Stripe from "stripe";
import { NextIronRequest, withSession } from "../../../../util/session";
import { AppliedDiscount } from "./apply";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const user = req.session.get("user");
	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}

	const controller = new CartController(req.session.get("cart"));
	const cart = controller.iterable();
	const code = (req.session.get("discountCode") as AppliedDiscount).code;
	if (!code || !cart) {
		return res.status(400).json({ error: "No items in your cart or no active discount code to recalculate" });
	}

	const stripe = stripeConnect();
	let promotionalCodes;
	try {
		const { data: _codes } = await stripe.promotionCodes.list({
			code,
			expand: ["data.coupon.applies_to"],
		});
		promotionalCodes = _codes;
	} catch (e: any) {
		console.error(e.message.replace(/"/g, ""));
		return res.status(500).json({
			error: "Unable to retrieve promotional codes from Stripe.",
		});
	}

	if (cart[0].type === "subscription") {
		return res.status(400).json({
			error: "Discounts cannot be applied to subscriptions.",
		});
	}

	if (promotionalCodes.length < 1) {
		return res.status(404).json({
			error: "No discount code that matched the input was found.",
		});
	}

	const promotionalCode = promotionalCodes[0];

	if (!promotionalCode.id) {
		return res.status(404).json({
			error: "No discount code that matched the input was found.",
		});
	}

	if (!promotionalCode.active) {
		return res.status(410).json({
			message: "The code has been found, however it has already expired.",
		});
	}

	if (!(promotionalCode.times_redeemed <= (promotionalCode.max_redemptions ?? 0))) {
		return res.status(410).json({
			message: "The code has reached its maximum redemptions.",
		});
	}

	const coupon: Stripe.Coupon = promotionalCode.coupon;
	const cartTotal = cart.reduce(
		(acc, item: CartItem) => acc + (getSelectedPriceValue(item, item.selectedPrice).value / 100) * item.quantity,
		0
	);

	if ((promotionalCode.restrictions.minimum_amount ?? 0) / 100 > cartTotal) {
		return res.status(403).json({
			error: `The code can only be used when the cart contents are above $${promotionalCode.restrictions.minimum_amount}`,
		});
	}

	const isPercent = coupon.percent_off ? true : false;
	const discountAmount = (isPercent ? coupon.percent_off! : coupon.amount_off!) / 100;
	const appliesTo: string[] = coupon.applies_to?.products ?? [];
	let discountedItems: DiscountItem[] = [];
	let totalSavings = 0;

	if (isPercent) {
		if (appliesTo.length >= 1) {
			const cartItemIds = cart.map((item) => item.id);
			for (let itemId of cartItemIds) {
				if (appliesTo.includes(itemId)) {
					const product = await calculateDiscount(
						cart.find((item) => item.id === itemId)!,
						discountAmount,
						isPercent
					);
					discountedItems.push(product);
					totalSavings += product.savings;
				}
			}
		} else {
			for (let item of cart) {
				const product = await calculateDiscount(item, discountAmount, isPercent);
				discountedItems.push(product);
				totalSavings += product.savings;
			}
		}
	} else {
		totalSavings = discountAmount;
	}

	req.session.set("discountCode", { code, discountedItems, totalSavings, isPercent });
	await req.session.save();

	return res.status(200).json({ code, discountedItems, totalSavings, isPercent });
};

export default withSession(handler);
