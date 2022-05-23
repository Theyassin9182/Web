import { APIEmbedField } from "discord-api-types/v10";
import Stripe from "stripe";
import { EventResponse } from "../../../../stripe";

type SubscriptionEvent<T> = Partial<T> & { plan: Stripe.Plan };

export default async function (
	event: Stripe.Event,
	stripe: Stripe
): Promise<EventResponse> {
	const subscription = event.data
		.object as SubscriptionEvent<Stripe.Subscription>;

	const product = await stripe.products.retrieve(
		subscription.plan.product as string
	);
	const lastInvoice = await stripe.invoices.retrieve(
		subscription.latest_invoice as string
	);

	let fields: APIEmbedField[] = [
		{
			name: "Customer",
			value: `<@!${lastInvoice.metadata!.boughtByDiscordId}> (${
				lastInvoice.metadata!.boughtByDiscordId
			})\n> ${subscription.customer as string}`,
		},
		{
			name: "Subscription",
			value: `${product.name} ($${subscription.plan.amount! / 100}/${
				subscription.plan.interval
			})`,
			inline: true,
		},
		{
			name: "Duration",
			value: `<t:${subscription.start_date}> - <t:${subscription.ended_at}>`,
			inline: true,
		},
	];

	return {
		result: {
			avatar_url: "https://stripe.com/img/v3/home/twitter.png",
			embeds: [
				{
					title: "Subscription ended",
					color: 16731212,
					fields,
				},
			],
		},
	};
}