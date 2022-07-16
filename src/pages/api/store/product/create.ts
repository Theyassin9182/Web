import { NextApiResponse } from "next";
import { NextIronRequest, withSession } from "../../../../util/session";
import { dbConnect } from "src/util/mongodb";
import { Db } from "mongodb";
import { ProductPrice } from "src/components/control/store/ProductCreator";
import { stripeConnect } from "src/util/stripe";
import { createPayPal } from "src/util/paypal/PayPalEndpoint";
import PayPal from "src/util/paypal";
import { ObjectID } from "bson";
import { ProductCreateResponse } from "src/util/paypal/classes/Products";
import Stripe from "stripe";
import { redisConnect } from "src/util/redis";
import { TIME } from "src/constants";

interface ProductData {
	name: string;
	type: "single" | "subscription";
	category?: string;
	prices: ProductPrice[];
	description?: string; // Invoice descriptions
	primaryTitle: string;
	primaryBody: string;
	secondaryTitle?: string;
	secondaryBody?: string;
}

enum ProductIntervals {
	"Daily" = "day",
	"Weekly" = "week",
	"Monthly" = "month",
	"Annually" = "year",
}

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	if (req.method?.toLowerCase() !== "post") {
		return res.status(405).json({
			error: `Method '${req.method?.toUpperCase()}' cannot be used on this endpoint.`,
		});
	}

	const user = req.session.get("user");

	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}

	if (!user.developer) {
		return res.status(401).json({ error: "You can't do this." });
	}

	const productData: ProductData = req.body;
	if (!productData) {
		return res.status(400).json({ error: "Invalid body." });
	}

	try {
		// TODO:(InBlue) create a way for images to be uploaded when creating a product.
		const db: Db = await dbConnect();
		const stripe = stripeConnect();
		const paypal = new PayPal();
		const redis = await redisConnect();

		let paypalProduct: ProductCreateResponse;

		const stripeProduct = await stripe.products.create({
			name: productData.name,
			active: true,
			tax_code: "txcd_10000000", // General - Electronically Supplied Services
			...(productData.description &&
				productData.description.length >= 1 && {
					description: productData.description,
				}),
			metadata: {
				hidden: "true",
				type: productData.type,
				...(productData.category && { category: productData.category }),
			},
		});

		try {
			paypalProduct = await paypal.products.create({
				id: stripeProduct.id,
				name: productData.name,
				type: "DIGITAL",
				...(productData.description &&
					productData.description.length >= 1 && {
						description: productData.description,
					}),
			});
		} catch (e: any) {
			return res.status(500).json({
				message: "Unable to create product on PayPal",
				error: e.message,
			});
		}

		try {
			Promise.all([
				redis.set(`webhooks:product-created:${stripeProduct.id}:creator`, user.id, "PX", TIME.minute * 5),
				redis.set(`webhooks:product-created:${stripeProduct.id}:prices:received`, 0, "PX", TIME.minute * 5),
				redis.set(
					`webhooks:product-created:${stripeProduct.id}:prices:expected`,
					productData.prices.length,
					"PX",
					TIME.minute * 5
				),
			]);
		} catch (e: any) {
			return res.status(500).json({
				message: "Failed to add product to redis cache",
				error: e.message.replace(/"/g, ""),
			});
		}

		if (productData.type === "single") {
			// Change provided price to cents
			const priceInCents = parseInt(
				(parseFloat(productData.prices[0].value as unknown as string) * 100).toString()
			);
			await stripe.prices.create({
				currency: "USD",
				product: stripeProduct.id,
				unit_amount: priceInCents,
				tax_behavior: "exclusive",
			});
			await redis.del("store:products:one-time");
		} else if (productData.type === "subscription") {
			const billingPlans = [];
			for (let i = 0; i < productData.prices.length; i++) {
				// Change provided price to cents
				const priceInCents = parseInt(
					(parseFloat(productData.prices[i].value as unknown as string) * 100).toString()
				);
				let intervalCount =
					parseInt(productData.prices[i].intervalCount || "1") === 0
						? 1
						: parseInt(productData.prices[i].intervalCount!);

				try {
					const priceWithTax =
						parseInt(productData.prices[i].value) + parseInt(productData.prices[i].value) * 0.0675;
					const plan = await paypal.plans.create({
						product_id: paypalProduct.id!,
						name: productData.name,
						status: "ACTIVE",
						...(productData.description &&
							productData.description.length >= 1 && {
								description: productData.description,
							}),
						billing_cycles: [
							{
								frequency: {
									interval_unit: ProductIntervals[productData.prices[i].interval!].toUpperCase() as
										| "DAY"
										| "WEEK"
										| "MONTH"
										| "YEAR",
									interval_count: intervalCount,
								},
								tenure_type: "REGULAR",
								sequence: 1,
								total_cycles: 0,
								pricing_scheme: {
									fixed_price: {
										value: priceWithTax.toFixed(2),
										currency_code: "USD",
									},
								},
							},
						],
						payment_preferences: {
							auto_bill_outstanding: true,
							payment_failure_threshold: 3,
							setup_fee_failure_action: "CONTINUE",
						},
					});

					// Create single-purchase products used for gifting subscriptions
					const giftableProduct = await stripe.products.create({
						name: productData.name,
						active: true,
						tax_code: "txcd_10000000", // General - Electronically Supplied Services
						...(productData.description &&
							productData.description.length >= 1 && {
								description: productData.description,
							}),
						default_price_data: {
							currency: "USD",
							tax_behavior: "exclusive",
							unit_amount: priceInCents,
						},
						metadata: {
							type: "giftable",
							hidden: "true",
							ignoreWebhook: "true",
						},
					});

					let price = await stripe.prices.create({
						currency: "USD",
						product: stripeProduct.id,
						unit_amount: priceInCents,
						tax_behavior: "exclusive",
						recurring: {
							interval: ProductIntervals[productData.prices[i].interval!],
							interval_count: parseInt(productData.prices[i].intervalCount!) || 1,
						},
						metadata: {
							paypalPlan: plan.id,
							giftProduct: giftableProduct.id,
						},
					});

					billingPlans.push({
						paypal: plan.id,
						stripe: price.id,
					});
				} catch (e: any) {
					console.error(e);
					return res.status(500).json({
						message: "Unable to create subscription plan on PayPal",
						error: e.message,
					});
				}
			}
			Promise.all([
				redis.set(
					`webhooks:product-created:${paypalProduct.id}:billing-plans`,
					JSON.stringify(billingPlans),
					"PX",
					TIME.minute * 15
				),
				redis.set(
					`webhooks:product-created:${paypalProduct.id}:billing-plans:received`,
					0,
					"PX",
					TIME.minute * 15
				),
				redis.del("store:products:subscriptions"),
			]);
		}

		// Add store modal data to database
		await db.collection("products").insertOne({
			_id: stripeProduct.id as unknown as ObjectID,
			primaryTitle: productData.primaryTitle,
			primaryBody: productData.primaryBody,
			secondaryTitle: productData.secondaryTitle || "",
			secondaryBody: productData.secondaryBody || "",
		});

		return res.status(200).json({
			message: "Product added successfully.",
			product: stripeProduct.id,
		});
	} catch (e: any) {
		return res.status(500).json({ message: "Product could not be added.", error: e.message });
	}
};

export default withSession(handler);
