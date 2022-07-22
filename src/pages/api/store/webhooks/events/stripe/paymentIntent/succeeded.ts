import { APIEmbedField } from "discord-api-types/v10";
import { redisConnect } from "src/util/redis";
import Stripe from "stripe";
import { EventResponse, PaymentIntentItemDiscount, PaymentIntentItemResult } from "../../../stripe";

export default async function (event: Stripe.Event, stripe: Stripe): Promise<EventResponse> {
	let paymentIntent = event.data.object as Stripe.PaymentIntent;
	if (paymentIntent.description === "Subscription created" || paymentIntent.description === "Subscription update") {
		return {
			result: null,
		};
	}

	paymentIntent = await stripe.paymentIntents.retrieve(paymentIntent.id);
	const invoice = await stripe.invoices.retrieve(paymentIntent.invoice!.toString(), { expand: ["discounts"] });
	let discounts: PaymentIntentItemDiscount[] = [];
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

	let payee: string = "";
	const customer = (await stripe.customers.retrieve(paymentIntent.customer as string)) as Stripe.Customer;

	if (invoice.metadata && invoice.metadata.boughtByDiscordId) {
		payee = invoice.metadata!.boughtByDiscordId;
	} else {
		payee = customer.metadata.discordId;
	}

	const fields: APIEmbedField[] = [
		{
			name: "Purchased by",
			value: `<@!${payee}> (${payee})\n> ${customer.email ?? "Unknown email"}`,
			inline: paymentIntent.metadata?.isGift && JSON.parse(paymentIntent.metadata.isGift),
		},
	];

	if (paymentIntent.metadata?.isGift && JSON.parse(paymentIntent.metadata.isGift)) {
		fields.push({
			name: "(Gift) Purchased for",
			value: `<@!${invoice!.metadata!.giftFor}> (${paymentIntent.metadata.giftFor})`,
			inline: true,
		});
		fields.push({ name: "_ _", value: "_ _", inline: true }); // Add an invisible embed field
	}

	fields.push({
		name: "Goods purchased",
		value: `• ${items
			.filter((item) => item.name !== "SALESTAX")
			.map((item) => {
				return `${item.quantity}x ${item.name} ($${item.price.toFixed(2)})`;
			})
			.join("\n• ")}`,
		inline: true,
	});

	if (discounts.length >= 1) {
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
	await redis.del(`customer:purchase-history:${payee}`);

	return {
		result: {
			avatar_url: process.env.DOMAIN + "/img/store/gateways/stripe.png",
			embeds: [
				{
					title: "Successful Stripe Purchase",
					color: 6777310,
					fields,
					footer: {
						text: `Total purchase value: $${(invoice.amount_paid / 100).toFixed(
							2
						)} (incl. sales tax and discounts)`,
					},
				},
			],
		},
	};
}
