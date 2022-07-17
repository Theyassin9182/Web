import { APIEmbedField } from "discord-api-types/v10";
import convertStripeMetadata from "src/util/convertStripeMetadata";
import { toTitleCase } from "src/util/string";
import Stripe from "stripe";
import { EventResponse } from "../../../../stripe";

export default async function (event: Stripe.Event, stripe: Stripe): Promise<EventResponse> {
	const dispute = event.data.object as Stripe.Dispute;
	let metadata = convertStripeMetadata(dispute.metadata);

	const charge = await stripe.charges.retrieve(dispute.charge.toString());
	// const customer = (await stripe.customers.retrieve(
	// 	charge.customer as string
	// )) as Stripe.Customer;

	const fields: APIEmbedField[] = [
		// {
		// 	name: "Customer",
		// 	value: `${customer.name} (<@!${customer.metadata.discordId}>)\n> ${customer.email}`,
		// },
		{
			name: "Current status",
			value: toTitleCase(dispute.status.replace(/_/g, " ").replace("warning ", ":warning: ")),
			inline: true,
		},
		{
			name: "Dispute reason",
			value: `\`${dispute.reason}\``,
			inline: true,
		},
		{
			name: "_ _",
			value: "_ _",
			inline: true,
		},
		{
			name: "Evidence details",
			value: `• Due by: <t:${dispute.evidence_details.due_by}>\n• Already includes evidence: ${
				dispute.evidence_details.has_evidence ? "Yes" : "No"
			}`,
			inline: true,
		},
	];

	const hasEvidence = Object.values(dispute.evidence).filter((evidence) => evidence !== null).length >= 1;
	if (hasEvidence) {
		const evidence = Object.keys(dispute.evidence).map((k) => {
			// @ts-ignore
			if (dispute.evidence[k] !== null) {
				return {
					name: k,
					// @ts-ignore
					value: Object.values[k],
				};
			}
		});

		fields.push({
			name: "Provided Evidence",
			value: evidence.map((k, v) => `${k}: ${v}`).join("\n"),
		});
	}

	fields.push({
		name: "Disputed purchase",
		value: `Value (${dispute.currency.toUpperCase()}): **$${(dispute.amount / 100).toFixed(2)}**\nDate: <t:${
			charge.created
		}>`,
	});

	if (Object.keys(metadata).length >= 1) {
		fields.push({
			name: "Metadata",
			value: `\`\`\`json\n${JSON.stringify(metadata, null, "\t")}\`\`\``,
		});
	}

	return {
		result: {
			avatar_url: process.env.DOMAIN + "/img/store/gateways/stripe.png",
			embeds: [
				{
					title: "Charge dispute opened",
					description: `This is just for notification's sake, it is best to view a dispute within the [Stripe dashboard](https://dashboard.stripe.com/${
						process.env.NODE_ENV !== "production" && process.env.IN_TESTING ? "test/" : ""
					}payments/${
						dispute.charge
					} "Open disputed charge on the Stripe dashboard"), there you will be able to better assess this dispute.`,
					color: 6777310,
					fields,
				},
			],
		},
	};
}
