import { NextApiResponse } from "next";
import { Card } from "src/components/store/checkout/CheckoutForm";
import { NextIronRequest, withSession } from "src/util/session";
import { stripeConnect } from "src/util/stripe";

export interface StripePurchaseDetails {
	invoice_email: string;
	paymentMethod: Card;
}

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const user = await req.session.get("user");
	if (!user) {
		return res.status(403).json({ message: "You are unauthorized." });
	}

	const stripe = stripeConnect();
	const invoice = await stripe.invoices.retrieve(req.query.id.toString());
	const paymentIntent = await stripe.paymentIntents.retrieve(invoice.payment_intent as string);
	const paymentMethod = await stripe.paymentMethods.retrieve(paymentIntent.payment_method as string);

	const today = new Date();

	return res.status(200).json({
		// paymentIntent,
		invoice_email: paymentIntent.receipt_email,
		paymentMethod: {
			brand: paymentMethod.card?.brand,
			type: paymentMethod.card?.funding,
			expiry: {
				month: paymentMethod.card?.exp_month,
				year: paymentMethod.card?.exp_year,
			},
			last4: parseInt(paymentMethod.card?.last4!),
			expired:
				paymentMethod.card?.exp_year! <= today.getFullYear() ||
				(paymentMethod.card?.exp_year! <= today.getFullYear() &&
					paymentMethod.card?.exp_month! < today.getMonth() + 1),
		},
	} as StripePurchaseDetails);
};

export default withSession(handler);
