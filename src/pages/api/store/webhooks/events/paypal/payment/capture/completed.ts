import { APIEmbedField } from "discord-api-types/v10";
import { PurchaseRecord } from "src/pages/api/store/checkout/finalize/paypal";
import { UserData } from "src/types";
import { dbConnect } from "src/util/mongodb";
import PayPal from "src/util/paypal";
import { LinkDescription } from "src/util/paypal/classes/Products";
import { PayPalEvent, PayPalWebhookResource } from "src/util/paypal/classes/Webhooks";
import { createPayPal } from "src/util/paypal/PayPalEndpoint";
import { PayPalCartItem } from "src/util/paypal/types";
import { redisConnect } from "src/util/redis";
import { stripeConnect } from "src/util/stripe";
import Stripe from "stripe";
import { EventResponse } from "../../../../paypal";
import { PaymentIntentItemDiscount, PaymentIntentItemResult } from "../../../../stripe";

export default async function (event: PayPalEvent, paypal: PayPal): Promise<EventResponse> {
	const httpClient = await createPayPal();
	const stripe = stripeConnect();
	const db = await dbConnect();

	const orderUrl: LinkDescription = event.data.links.find((link: LinkDescription) => link.rel === "up")!;

	const { data }: { data: PayPalWebhookResource } = await httpClient(orderUrl.href);
	const existingPurchase = (await db.collection("purchases").findOne({ _id: data.id! })) as PurchaseRecord | null;

	if (existingPurchase?.confirmed) {
		return {
			result: null,
			error: "Purchase confirmation already completed. This is a duplicate event.",
			status: 200,
		};
	}

	const cartItems: PayPalCartItem[] = data.purchase_units![0].items.filter(
		(item: PayPalCartItem) => item.sku.split(":")[0] !== "SALESTAX"
	);

	for (let i = 0; i < cartItems.length; i++) {
		const id = cartItems[i].sku.split(":")[0];
		const interval = cartItems[i].sku.split(":")[1] as Stripe.Price.Recurring.Interval & "single";
		const stripeProduct = await stripe.products.retrieve(id);
		if (!stripeProduct) {
			return {
				result: null,
				error: `Received unknown product (name=${cartItems[i].name} id/sku=${cartItems[i].sku}) during paypal checkout.`,
			};
		}
		let query: Stripe.PriceListParams =
			interval !== "single"
				? {
						product: stripeProduct.id,
						recurring: { interval },
				  }
				: { product: stripeProduct.id };
		const { data: prices } = await stripe.prices.list(query);
		if ((prices[0].unit_amount! / 100).toFixed(2) !== cartItems[i].unit_amount.value) {
			return {
				result: null,
				error: `Mismatched price of ${cartItems[i].name} (id: ${cartItems[i].sku}).`,
			};
		}
	}

	const total = data.purchase_units![0].amount.value;
	const purchasedBy = data.purchase_units![0].custom_id.split(":")[0];
	const purchasedFor = data.purchase_units![0].custom_id.split(":")[1];
	const isGift = JSON.parse(data.purchase_units![0].custom_id.split(":")[2]);

	const customerEmail =
		event.data.payer?.email_address ??
		(
			(await stripe.customers.search({ query: `metadata['discordId']:'${purchasedBy}'` }))
				.data as Stripe.Customer[]
		)[0].email ??
		((await db.collection("users").findOne({ _id: purchasedBy })) as UserData).email ??
		"Unknown email";
	let fields: APIEmbedField[] = [
		{
			name: "Purchased by",
			value: `<@!${purchasedBy}> (${purchasedBy})\n> ${customerEmail}`,
			inline: isGift,
		},
	];

	if (isGift) {
		fields.push({
			name: "(Gift) Purchased for",
			value: `<@!${purchasedFor}> (${purchasedFor})`,
			inline: true,
		});
		fields.push({ name: "_ _", value: "_ _", inline: true }); // Add an invisible embed field
	}

	fields.push({
		name: "Goods purchased",
		value: `• ${cartItems
			.map((item) => {
				return `${item.quantity}x ${item.name} ($${item.unit_amount.value})`;
			})
			.join("\n• ")}`,
		inline: true,
	});

	const record = (await db.collection("purchases").findOne({ _id: data.id })) as PurchaseRecord;

	if (record && record.discounts.length >= 1) {
		let discounts: PaymentIntentItemDiscount[] = record.discounts;
		const items: PaymentIntentItemResult[] = record.items;

		discounts = Array.from(new Set(discounts));

		fields.push({
			name: "Discounts applied",
			value: `${discounts
				.map((discount) => {
					const itemsText = discount.appliesTo.map((itemId) => {
						const item = items.find((i) => i.id === itemId);
						return `> ${item?.name} (-$${(item?.price! * (discount.decimal / 100)).toFixed(2)})`;
					});
					return `**${discount.name}** (\`${discount.code}\`) - ${discount.percent ?? discount.amount}${
						discount.percent ? `\n${itemsText.join("\n")}` : ""
					}`;
				})
				.join("\n")}`,
			inline: true,
		});
		fields.push({ name: "_ _", value: "_ _", inline: true }); // Add an invisible embed field
	}

	const redis = await redisConnect();
	Promise.all([
		redis.del(`customer:purchase-history:${purchasedBy}`),
		db.collection("purchases").updateOne({ _id: data.id }, { $set: { confirmed: true } }),
	]);

	return {
		result: {
			avatar_url: process.env.DOMAIN + "/img/store/gateways/paypal.png",
			embeds: [
				{
					title: "Successful PayPal Purchase",
					color: 2777007,
					fields,
					footer: {
						text: `Total purchase value: $${total} (incl. sales tax and discounts)`,
					},
				},
			],
		},
	};
}
