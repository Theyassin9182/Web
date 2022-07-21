import { ObjectID } from "bson";
import { ObjectId } from "mongodb";
import { NextApiResponse } from "next";
import { dbConnect } from "src/util/mongodb";
import PayPal from "src/util/paypal";
import { redisConnect } from "src/util/redis";
import { stripeConnect } from "src/util/stripe";
import Stripe from "stripe";
import { NextIronRequest, withSession } from "../../../../../util/session";
import { PaymentIntentItemDiscount, PaymentIntentItemResult } from "../../webhooks/stripe";

export interface PurchaseRecord {
	_id: string;
	isGift: boolean;
	giftFor?: string;
	items: PaymentIntentItemResult[];
	discounts: PaymentIntentItemDiscount[];
	boughtBy: string;
	gateway: "stripe" | "paypal";
	purchaseTime: number;
	subscriptionId?: string;
	confirmed?: boolean;
}

interface RequestBody {
	stripeInvoice: string;
	status: "ACTIVE" | "CREATED" | "SAVED" | "APPROVED" | "VOIDED" | "COMPLETED" | "PAYER_ACTION_REQUIRED";
	isGift: boolean;
	giftFor: string;
	subscription?: string;
	customId?: string;
	giftSubscription?: GiftSubscription;
}

interface GiftSubscription {
	product: string;
	price: string;
}

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	if (req.method?.toLowerCase() !== "patch") {
		return res.status(405).json({
			error: `Method '${req.method?.toUpperCase()}' cannot be used on this endpoint.`,
		});
	}

	const orderID = req.query.orderID.toString();
	if (!orderID) {
		return res.status(400).json({
			error: "No orderID was provided to finalize this purchase.",
		});
	}

	const user = req.session.get("user");
	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}

	const { stripeInvoice, status, isGift, giftFor, subscription, giftSubscription }: RequestBody = req.body;

	if (status !== "COMPLETED" && status !== "ACTIVE") {
		return res.status(425).json({ error: "Payment has not completed processing." });
	}

	const db = await dbConnect();
	const stripe = stripeConnect();
	const redis = await redisConnect();
	const customer = await db.collection("customers").findOne({ discordId: user.id });

	if (!customer) {
		return res.status(404).json({
			error: "Unable to find customer. If you do not receive your purchased goods please contact support and reference the following order id",
			orderID,
		});
	}

	let metadata: Stripe.Emptyable<Stripe.MetadataParam> = {
		boughtByDiscordId: user.id,
		isGift: JSON.stringify(isGift),
		...(isGift && { giftFor }),
	};

	const invoice = await stripe.invoices.retrieve(stripeInvoice, {
		expand: ["discounts"],
	});

	if (!invoice) {
		return res.status(404).json({
			error: "invoiceId provided did not have any results.",
		});
	}

	try {
		let discounts: Partial<PaymentIntentItemDiscount>[] = [];
		for (let i = 0; i < (invoice.discounts as Stripe.Discount[] | Stripe.DeletedDiscount[])?.length; i++) {
			const discount = invoice.discounts![i] as Stripe.Discount | Stripe.DeletedDiscount;
			const { data: coupon } = await stripe.promotionCodes.list({
				coupon: discount.coupon?.id,
			});

			discounts.push({
				id: discount.id,
				code: coupon[0].code,
				appliesTo: [],
				name: coupon[0].coupon.name || "N/A",
				decimal: discount.coupon.percent_off ?? discount.coupon.amount_off!,
				...(discount.coupon.percent_off
					? { percent: `${discount.coupon.percent_off}%` }
					: { amount: `$${(discount.coupon.amount_off! / 100).toFixed(2)}` }),
			});
		}

		let items: PaymentIntentItemResult[] = [];
		for (let lineItem of invoice.lines.data) {
			if (lineItem.description !== null) {
				const usedDiscounts =
					lineItem.discount_amounts
						?.filter((discount) => discount.amount > 0)
						.map((discount) => discount.discount) ?? [];

				const product = await stripe.products.retrieve(lineItem.price?.product as string);

				usedDiscounts.forEach((usedDiscount) => {
					const found = discounts.find((discount) => discount.id === usedDiscount)!;
					found.appliesTo?.push(product.id);
				});
				items.push({
					id: product.id,
					name: product.name,
					price: lineItem.amount / 100,
					quantity: lineItem.quantity!,
					type: lineItem.price?.type!,
				});
			}
		}

		if (subscription) {
			const paypal = new PayPal();
			const subscriptionInfo = await paypal.subscriptions.get(subscription);
			if (!isGift) {
				await db.collection("customers").updateOne(
					{
						discordId: user.id,
					},
					{
						$set: {
							subscription: {
								provider: "paypal",
								id: subscription,
								purchaseTime: new Date().getTime(),
								expiryTime: new Date(subscriptionInfo.billing_info?.next_billing_time!).getTime(),
								automaticRenewal: true,
							},
						},
					},
					{ upsert: true }
				);
			}
		} else if (giftSubscription) {
			await db.collection("gifts").insertOne({
				_id: orderID as unknown as ObjectID,
				code: Math.random().toString(36).substring(2),
				from: user.id,
				to: giftFor,
				redeemed: false,
				purchasedAt: new Date().getTime(),
				product: {
					id: giftSubscription.product,
					price: giftSubscription.price,
				},
			});
		}

		await Promise.all([
			db.collection("purchases").insertOne({
				_id: orderID as unknown as ObjectId,
				boughtBy: user.id,
				gateway: "paypal",
				isGift,
				giftFor,
				items: items.filter((item) => item !== undefined),
				discounts,
				purchaseTime: new Date().getTime(),
				confirmed: false,
				...(subscription && { subscriptionId: subscription }),
			}),
			redis.del(`customer:purchase-history:${user.id}`),
			stripe.invoices.update(invoice.id, { metadata }),
			stripe.invoices.voidInvoice(invoice.id),
		]);

		req.session.unset("cart");
		req.session.unset("discountCode");

		await req.session.save();
		return res.status(200).json({ orderID });
	} catch (e: any) {
		console.error(
			`Error updating purchase records data after paypal purchase completion: ${e.message.replace(/"/g, "")}`
		);
		return res.status(200).json({
			orderID,
			error: "An error occurred, however the payment was successful.",
		});
	}
};

export default withSession(handler);
