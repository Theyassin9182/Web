import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";
import { useRouter } from "next/router";
import { useState } from "react";
import { Title } from "src/components/Title";
import Button from "src/components/ui/Button";

interface Props {
	userId: string;
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CreateCard({ userId }: Props) {
	return (
		<Elements stripe={stripePromise}>
			<Content userId={userId} />
		</Elements>
	);
}

function Content({ userId }: Props) {
	const [processing, setProcessing] = useState(false);
	const [error, setError] = useState<string | null>();

	const router = useRouter();
	const stripe = useStripe();
	const stripeElements = useElements();

	const submitNewCard = async () => {
		if (!stripe || !stripeElements) return;
		try {
			setProcessing(true);
			const { error, paymentMethod } = await stripe.createPaymentMethod({
				type: "card",
				card: stripeElements.getElement("card")!,
			});
			if (error) {
				return setError(error.message);
			}
			if (paymentMethod) {
				try {
					await axios({
						url: `/api/customers/${userId}/cards/add`,
						method: "POST",
						data: {
							id: paymentMethod.id,
						},
					});
				} catch (e: any) {
					return setError(e.response.data.message);
				}
			}
			router.reload();
		} catch (e) {
			setError(null);
		} finally {
			setProcessing(false);
		}
	};

	return (
		<>
			<Title size="medium" className="font-semibold">
				Add a Card
			</Title>
			<CardElement
				options={{
					disabled: processing,
					style: {
						base: {
							color: "#ffffff",
							fontFamily: "Inter, sans-serif",
							fontWeight: "400",
							fontSize: "14px",
							"::placeholder": {
								color: "#9ca3af",
							},
						},
					},
					classes: {
						base: "mt-1 px-3 py-2 border bg-white border-neutral-300 dark:border-neutral-700 dark:bg-black/30 rounded-md focus:border-dank-300",
						focus: "border-[#199532] outline-none",
						invalid: "border-[#F84A4A]",
					},
				}}
			/>
			<div className="mt-3 flex justify-end">
				<Button
					size="medium"
					onClick={(e) => {
						e.preventDefault();
						submitNewCard();
					}}
				>
					Create new card
				</Button>
			</div>
			<p className="text-right text-sm text-red-400">
				{error !== null ? error : "Failed to add new card. Please try again later."}
			</p>
		</>
	);
}
