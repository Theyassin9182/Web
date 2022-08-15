import { Db } from "mongodb";
import { NextApiResponse } from "next";
import { CardData } from "src/components/store/checkout/CheckoutForm";
import { dbConnect } from "src/util/mongodb";
import { stripeConnect } from "src/util/stripe";
import Stripe from "stripe";
import { NextIronRequest, withSession } from "../../../../util/session";

export interface Customer {
	_id: string;
	discordId: string;
	purchases: CustomerPurchases[];
	subscription?: CustomerSubscription;
}

interface CustomerSubscription {
	provider: "stripe" | "paypal";
	id: string;
	gifted: boolean;
	giftedBy?: string;
	purchaseTime: number;
	expiryTime: number;
	automaticRenewal: boolean;
	cancelled?: boolean;
}

interface CustomerPurchases {
	type: "stripe" | "paypal";
	id: string;
}

export interface SensitiveCustomerData {
	activeSubscription?: string;
	cards: {
		default: CardData;
		other: CardData[];
	};
}

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	if (req.method?.toLowerCase() !== "get") {
		return res.status(405).json({
			error: `Method '${req.method?.toUpperCase()}' cannot be used on this endpoint.`,
		});
	}

	const user = req.session.get("user");
	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}

	let sensitive = false;
	if (req.query.sensitive && req.query.sensitive === "true") {
		sensitive = true;
	}

	if (sensitive && !req.query.userId) {
		return res.status(406).json({
			error: "Sensitive parameter can only be used in conjunction with id parameter.",
		});
	}

	const db: Db = await dbConnect();
	const _customer = (await db.collection("customers").findOne({ discordId: req.query.userId })) as Customer;

	const stripe = stripeConnect();

	if (!sensitive) {
		return res.status(200).json({
			id: _customer ? _customer._id : req.query.userId,
			isSubscribed: _customer && _customer.subscription ? true : false,
		});
	} else if (sensitive && user.id !== req.query.userId) {
		return res.status(401).json({ error: "You cannot access this information." });
	} else if (sensitive && user.id === req.query.userId) {
		let customer: Stripe.Customer | undefined;
		if (!_customer) {
			const unrecordedCustomer = (
				await stripe.customers.search({
					query: `metadata['discordId']: '${user.id}' OR email:'${user.email}'`,
				})
			).data[0];

			if (unrecordedCustomer) {
				customer = unrecordedCustomer;
			} else {
				return res.status(404).json({
					error: "Requested user was not found in the database.",
				});
			}
		} else {
			customer = (await stripe.customers.retrieve(_customer._id, {
				expand: ["invoice_settings.default_payment_method"],
			})) as Stripe.Customer;
		}

		let defaultPaymentMethod: Stripe.PaymentMethod | null = null;
		if (customer.invoice_settings.default_payment_method) {
			defaultPaymentMethod = await stripe.paymentMethods.retrieve(
				((customer.invoice_settings.default_payment_method as Stripe.PaymentMethod).id as string) ??
					customer.invoice_settings.default_payment_method
			);
		}

		const { data: paymentMethods } = await stripe.customers.listPaymentMethods(customer.id, {
			type: "card",
		});

		const today = new Date();

		return res.status(200).json({
			...(_customer &&
				_customer.subscription && {
					activeSubscription: _customer.subscription,
				}),
			cards: {
				default: defaultPaymentMethod
					? {
							id: defaultPaymentMethod.id,
							card: {
								brand: defaultPaymentMethod.card?.brand,
								type: defaultPaymentMethod.card?.funding,
								expiry: {
									month: defaultPaymentMethod.card?.exp_month,
									year: defaultPaymentMethod.card?.exp_year,
								},
								last4: defaultPaymentMethod.card?.last4,
								expired:
									defaultPaymentMethod.card?.exp_year! < today.getFullYear() ||
									(defaultPaymentMethod.card?.exp_year! <= today.getFullYear() &&
										defaultPaymentMethod.card?.exp_month! < today.getMonth() + 1),
							},
					  }
					: null,
				other: paymentMethods
					.filter((pm) => pm.id !== defaultPaymentMethod?.id)
					.map((pm: Stripe.PaymentMethod) => {
						return {
							id: pm.id,
							card: {
								brand: pm.card?.brand,
								type: pm.card?.funding,
								expiry: {
									month: pm.card?.exp_month,
									year: pm.card?.exp_year,
								},
								last4: pm.card?.last4,
								expired:
									pm.card?.exp_year! < today.getFullYear() ||
									(pm.card?.exp_year! <= today.getFullYear() &&
										pm.card?.exp_month! < today.getMonth() + 1),
							},
						};
					}),
			},
		});
	}
};

export default withSession(handler);
