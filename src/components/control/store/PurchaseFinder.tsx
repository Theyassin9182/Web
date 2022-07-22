import { useState } from "react";
import Input from "src/components/store/Input";
import { Title } from "src/components/Title";
import clsx from "clsx";
import axios from "axios";
import Button from "src/components/ui/Button";
import { AggregatedPurchaseRecordPurchases as AggregatedPurchaseRecord } from "src/pages/api/customers/[userId]/history";
import { toast } from "react-toastify";

interface Props {
	showPurchase: (purchase: AggregatedPurchaseRecord) => void;
}

export default function PurchaseFinder({ showPurchase }: Props) {
	const [orderId, setOrderId] = useState("");

	const submitChanges = () => {
		if (orderId.length >= 10) {
			axios({
				url: "/api/customers/purchases?find=" + orderId,
				method: "POST",
				data: {
					orderId,
				},
			})
				.then(({ data }) => {
					showPurchase(data.history[0]);
				})
				.catch((e) => {
					console.error(e);
					toast.error("No order with the provided ID was found.", {
						theme: "colored",
						position: "top-right",
					});
				});
		}
	};

	return (
		<>
			<Title size="big">Find an order</Title>
			<p className="text-neutral-600 dark:text-neutral-400">
				Currently, you are only able to search using the order ID
			</p>
			<div className="mt-4">
				<Input
					width="w-full"
					type={"text"}
					placeholder={"in_1L56LCBa4aPPOZn7BlN4Jm5D"}
					value={orderId}
					onChange={(e) => setOrderId(e.target.value)}
					label={
						<>
							Order ID
							<sup className="text-red-500">*</sup>
						</>
					}
				/>
			</div>
			<div className="sticky left-0 -bottom-0 w-full bg-neutral-100 py-10 dark:bg-dark-100">
				<Button
					size="medium-large"
					variant={orderId.length >= 10 ? "primary" : "dark"}
					className={clsx(orderId.length < 10 && "cursor-not-allowed", "w-full")}
					onClick={submitChanges}
				>
					Search
				</Button>
			</div>
		</>
	);
}
