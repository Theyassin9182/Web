import { ObjectID } from "bson";
import { ObjectId } from "mongodb";
import { NextApiResponse } from "next";
import { dbConnect } from "src/util/mongodb";
import { redisConnect } from "src/util/redis";
import { toTitleCase } from "src/util/string";
import { stripeConnect } from "src/util/stripe";
import Stripe from "stripe";
import { NextIronRequest, withSession } from "../../../../../util/session";
import { PaymentIntentItemDiscount, PaymentIntentItemResult } from "../../webhooks/stripe";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	if (req.method?.toLowerCase() !== "patch") {
		return res.status(405).json({
			error: `Method '${req.method?.toUpperCase()}' cannot be used on this endpoint.`,
		});
	}

	const invoiceId = req.query.invoice.toString();
	if (!invoiceId) {
		return res.status(400).json({
			error: "No invoice id was provided to finalize this purchase.",
		});
	}

	const user = req.session.get("user");
	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}

	const { customerName, isGift, giftFor } = req.body;

	const db = await dbConnect();
	const stripe = stripeConnect();
	const redis = await redisConnect();

	const dbCustomer = await db.collection("customers").findOne({ discordId: user.id });

	if (!dbCustomer) {
		return res.status(500).json({
			error: "Unable to find customer. If you do not receive your purchased goods please contact support and reference the following invoice id",
			invoiceId,
		});
	}

	const invoice = await stripe.invoices.retrieve(invoiceId, {
		expand: ["payment_intent.payment_method", "discounts"],
	});

	const subscription = invoice.billing_reason === "subscription_create";

	let customerData: Stripe.CustomerUpdateParams = {};
	let metadata = {
		boughtByDiscordId: user.id,
		isGift,
		...(isGift && { giftFor }),
	};

	const customer = (await stripe.customers.retrieve(dbCustomer._id)) as Stripe.Customer;

	if (!customer.name) {
		customerData.name = customerName;
	}

	if (!customer.email) {
		customerData.email = user.email;
	}

	if (!customer.invoice_settings.default_payment_method) {
		customerData.invoice_settings = {
			default_payment_method: (
				(invoice.payment_intent as Stripe.PaymentIntent).payment_method as Stripe.PaymentMethod
			).id,
		};
	}

	try {
		let discounts: PaymentIntentItemDiscount[] = [];
		for (let discount of invoice.discounts as Stripe.Discount[]) {
			const { data: coupon } = await stripe.promotionCodes.list({
				coupon: discount.coupon?.id,
			});
			console.log(coupon[0].coupon.name);
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
			if (lineItem.description === null) {
				items.push({
					id: "SALESTAX",
					name: "SALESTAX",
					price: lineItem.amount / 100,
					quantity: 1,
					type: lineItem.price?.type!,
				});
			} else {
				const product = await stripe.products.retrieve(lineItem.price!.product as string);
				const usedDiscounts =
					lineItem.discount_amounts?.filter((da) => da.amount > 0).map((discount) => discount.discount) ?? [];

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
					...(lineItem.price?.recurring && {
						interval: lineItem.price?.recurring?.interval,
						intervalCount: lineItem.price?.recurring?.interval_count,
					}),
				});
			}
		}

		Promise.all([
			stripe.customers.update(customer.id, customerData),
			stripe.invoices.update((invoice.payment_intent as Stripe.PaymentIntent).invoice as string, { metadata }),
		]);

		if (subscription) {
			const subscriptionInfo = await stripe.subscriptions.retrieve(invoice.subscription as string);
			if (!isGift) {
				await db.collection("customers").updateOne(
					{
						discordId: user.id,
					},
					{
						$set: {
							subscription: {
								provider: "stripe",
								id: subscriptionInfo.id,
								purchaseTime: subscriptionInfo.current_period_end,
								expiryTime: invoice.period_end,
								automaticRenewal: true,
							},
						},
					},
					{ upsert: true }
				);
			}
		} else if (invoice.metadata?.giftSubscription && JSON.parse(invoice.metadata.giftSubscription)) {
			const product = await stripe.products.retrieve(
				items.filter((item) => item.name !== "SALESTAX")[0].id as string
			);
			await db.collection("gifts").insertOne({
				_id: invoice.id as unknown as ObjectID,
				code: Math.random().toString(36).substring(2),
				from: user.id,
				to: giftFor,
				redeemed: false,
				purchasedAt: new Date().getTime(),
				product: {
					id: product.id,
					price: product.default_price,
				},
			});
		}

		await Promise.all([
			db.collection("purchases").insertOne({
				_id: invoice.id as unknown as ObjectId,
				boughtBy: user.id,
				gateway: "stripe",
				isGift,
				giftFor,
				discounts,
				items: items.filter((item) => item.name !== "SALESTAX"),
				purchaseTime: new Date().getTime(),
			}),
			redis.del(`customer:purchase-history:${user.id}`),
		]);
		req.session.unset("cart");
		req.session.unset("discountCode");

		await req.session.save();
		return res.status(200).json({ invoiceId });
	} catch (e: any) {
		console.error(`Error updating Stripe data after purchase completion: ${e.message.replace(/"/g, "")}`);
		return res.status(200).json({
			invoiceId,
			error: "An error occurred, however the payment was successful.",
		});
	}
};

export default withSession(handler);
