import { NextApiResponse } from "next";
import { NextIronRequest } from "src/util/session";
import { dbConnect } from "src/util/mongodb";
import { ObjectId } from "mongodb";
import { CartItem } from "src/pages/store";
import { stripeConnect } from "src/util/stripe";
import Stripe from "stripe";
import { toTitleCase } from "src/util/string";
import CartController from "src/util/cart/controller";
import { AppliedDiscount } from "../hooks/useDiscount";
import { StoreConfiguration } from "src/contexts/StoreProvider";
import { getSelectedPriceValue } from ".";
import { IncomingMessage } from "http";
import { Session } from "next-iron-session";

export interface CheckoutSetupImpl {
	invoice: string;
	client_secret: string;
	subscription?: string;
}

export const checkoutSetup = async (
	req: IncomingMessage & {
		cookies: Partial<{
			[key: string]: string;
		}>;
	} & {
		session: Session;
	}
): Promise<CheckoutSetupImpl> => {
	return new Promise(async (resolve, reject) => {
		const stripe = stripeConnect();
		const db = await dbConnect();

		const user = await req.session.get("user");
		if (!user) {
			return reject({ error: "You are not logged in." });
		}

		const config = (await req.session.get("store-config")) as StoreConfiguration;
		const controller = new CartController(req.session.get("cart"));
		const cart = controller.iterable();
		if (!cart) {
			return reject({ error: "You must have items in your cart." });
		}

		const dbCustomer = await db.collection("customers").findOne({ discordId: user.id });

		let customer: Stripe.Customer;
		if (dbCustomer) {
			customer = (await stripe.customers.retrieve(dbCustomer._id)) as Stripe.Customer;
		} else {
			try {
				const unrecordedCustomer = (
					await stripe.customers.search({
						query: `metadata['discordId']: '${user.id}' OR email:'${user.email}'`,
					})
				).data[0];

				if (unrecordedCustomer) {
					customer = unrecordedCustomer;

					await db.collection("customers").insertOne({
						_id: customer.id as unknown as ObjectId,
						discordId: user.id,
					});
				} else {
					customer = await stripe.customers.create({
						email: user.email,
						metadata: {
							discordId: user.id,
						},
					});

					await db.collection("customers").insertOne({
						_id: customer.id as unknown as ObjectId,
						discordId: user.id,
					});
				}
			} catch (e: any) {
				console.error(e);
				console.error(`Error while creating Stripe customer: ${e.message.split(/"/g, "")}`);
				return reject({ error: "Unable to create new customer" });
			}
		}

		if (!customer) {
			return reject({ error: "Unable to establish customer" });
		}

		let openInvoices =
			(
				await stripe.invoices.list({
					customer: customer.id,
					status: "open",
				})
			).data ?? [];

		if (openInvoices.length >= 1) {
			for (let openInvoice of openInvoices) {
				try {
					await stripe.invoices.voidInvoice(openInvoice.id);
				} catch {
					if (process.env.NODE_ENV === "production" && !process.env.IN_TESTING) {
						console.error(`Failed to close invoice ${openInvoice.id} for customer ${customer.id}`);
					}
				}
			}
		}

		let discount: Stripe.PromotionCode | null = null;
		let discountCode: AppliedDiscount | undefined = await req.session.get("discountCode");

		if (discountCode) {
			let promotionalCode = await stripe.promotionCodes.list({
				code: discountCode?.code,
				active: true,
			});

			discount = promotionalCode.data[0];
		}

		try {
			if (cart.length === 1 && cart[0].type === "subscription") {
				if (!config.isGift) {
					const subscription = await stripe.subscriptions.create({
						customer: customer.id!,
						payment_behavior: "default_incomplete",
						expand: ["latest_invoice.payment_intent"],
						...(discount && { coupon: discount.coupon.id }),
						items: [{ price: cart[0].selectedPrice }],
					});
					const invoice = subscription.latest_invoice as Stripe.Invoice;

					return resolve({
						client_secret: (invoice?.payment_intent as Stripe.PaymentIntent)?.client_secret!,
						invoice: invoice?.id,
						subscription: subscription.id,
					});
				} else if (config.isGift) {
					const giftProduct = await stripe.products.retrieve(
						getSelectedPriceValue(cart[0], cart[0].selectedPrice).giftProductId!
					);
					// Gift subscription invoice item
					await stripe.invoiceItems.create({
						customer: customer.id,
						currency: "usd",
						price: giftProduct.default_price as string,
						quantity: 1,
					});
					// Sales tax invoice item
					await stripe.invoiceItems.create({
						customer: customer?.id!,
						currency: "usd",
						unit_amount_decimal: (
							getSelectedPriceValue(cart[0], cart[0].selectedPrice).value * 0.0675
						).toFixed(0),
					});
					const giftInvoice = await stripe.invoices.create({
						customer: customer.id,
						auto_advance: false,
						collection_method: "charge_automatically",
						...(discount && { coupon: discount.coupon.id }),
						metadata: {
							boughtByDiscordId: user.id,
							giftSubscription: "true",
							giftSubscriptionFor: config.giftRecipient,
						},
					});

					const finalizedInvoice = await stripe.invoices.finalizeInvoice(giftInvoice.id);
					const paymentIntent = await stripe.paymentIntents.update(
						finalizedInvoice.payment_intent as string,
						{
							description: `Payment for 1x ${giftProduct.name} gift subscription (${toTitleCase(
								getSelectedPriceValue(cart[0], cart[0].selectedPrice).interval?.period!
							)})`,
						}
					);

					return resolve({
						client_secret: paymentIntent.client_secret!,
						invoice: finalizedInvoice.id,
					});
				}
			}

			await Promise.all(
				cart.map((item) =>
					stripe.invoiceItems.create({
						customer: (customer as Stripe.Customer)?.id!,
						currency: "usd",
						price: item.selectedPrice,
						quantity: item.quantity,
					})
				)
			);

			/**
			 * Add Sales tax to the Stripe total. The 10% discount for orders >= $20
			 * is calculated later here.
			 */
			await stripe.invoiceItems.create({
				customer: customer?.id!,
				currency: "usd",
				unit_amount_decimal: (
					cart.reduce(
						(acc: number, item: CartItem) =>
							acc + (getSelectedPriceValue(item, item.selectedPrice).value / 100) * item.quantity,
						0
					) *
					0.0675 *
					100
				).toFixed(0),
			});

			const pendingInvoice = await stripe.invoices.create({
				customer: customer?.id!,
				auto_advance: false,
				collection_method: "charge_automatically",
				metadata: {
					boughtByDiscordId: user.id,
				},
			});

			const discounts: Stripe.InvoiceUpdateParams.Discount[] = [];

			if (discountCode && discount) {
				discounts.push({ coupon: discount.coupon.id });
			}
			if (pendingInvoice.total / 100 >= 20) {
				discounts.push({ coupon: "THRESHOLD" });
			}
			await stripe.invoices.update(pendingInvoice.id, {
				discounts,
			});

			const finalizedInvoice = await stripe.invoices.finalizeInvoice(pendingInvoice.id);
			const paymentIntent = await stripe.paymentIntents.update(finalizedInvoice.payment_intent as string, {
				description: `Payment for ${cart.map((item) => `${item.quantity}x ${item.name}`).join(", ")}`,
			});

			return resolve({
				client_secret: paymentIntent.client_secret!,
				invoice: finalizedInvoice.id,
			});
		} catch (e: any) {
			console.error(e.message.replace(/"/g, ""));
			return reject({ error: "Error while creating Stripe Invoice." });
		}
	});
};
