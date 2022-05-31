import { APIEmbedField } from "discord-api-types/v10";
import PayPal from "src/util/paypal";
import { PayPalEvent } from "src/util/paypal/classes/Webhooks";
import { redisConnect } from "src/util/redis";
import { stripeConnect } from "src/util/stripe";
import { EventResponse } from "../../../../paypal";

const billingPeriod = {
	day: "Daily",
	week: "Weekly",
	month: "Monthly",
	year: "Annually",
};

export default async function (event: PayPalEvent, paypal: PayPal): Promise<EventResponse> {
	let fields: APIEmbedField[] = [];
	if (!event.data.custom) {
		return {
			result: null,
			error: "Old subscription. Ignore.",
			status: 200,
		};
	}

	const subscription = await paypal.subscriptions.get(event.data.billing_agreement_id!);
	const plan = event.data.custom!.split(":")[0];
	const purchasedBy = event.data.custom!.split(":")[1];
	const purchasedFor = event.data.custom!.split(":")[2];
	const isGift = purchasedBy !== purchasedFor;

	const stripe = stripeConnect();
	const price = (
		await stripe.prices.search({
			query: `active: 'true' AND metadata['paypalPlan']: '${plan}'`,
		})
	).data[0];

	if (!price) {
		return {
			result: null,
			error: "Unable to retrieve associated Stripe price object.",
			status: 200,
		};
	}

	const product = await stripe.products.retrieve(price.product as string);
	fields = [
		{
			name: "Purchased by",
			value: `<@!${purchasedBy}> (${purchasedBy})`,
			inline: isGift,
		},
	];

	if (isGift) {
		fields.push({
			name: "(Gift) Purchased for",
			value: `<@!${purchasedFor}> (${purchasedFor})`,
			inline: true,
		});
	}

	// TODO: InBlue - Perhaps have insights to individual products as their own page on the control panel,
	// if I make that add a link here to view the specific product page.
	fields.push.apply(fields, [
		{
			name: "Subscription",
			value: `${product.name} (${
				price.recurring!.interval_count === 1
					? billingPeriod[price.recurring!.interval]
					: `every ${price.recurring!.interval_count} ${price.recurring!.interval}s`
			})`,
		},
		{
			name: "Renewal",
			value: `User will be charged again on: <t:${
				new Date(subscription.billing_info?.next_billing_time!).getTime() / 1000
			}>`,
		},
	]);

	const redis = await redisConnect();
	await redis.del(`customer:purchase-history:${purchasedBy}`);

	return {
		result: {
			avatar_url: process.env.DOMAIN + "/img/store/gateways/paypal.png",
			embeds: [
				{
					title: "Successful PayPal Purchase (Subscription)",
					color: 2777007,
					fields,
				},
			],
		},
	};
}
