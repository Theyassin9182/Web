import { Title } from "src/components/Title";
import { Icon as Iconify } from "@iconify/react";
import { AggregatedPurchaseRecordPurchases } from "src/pages/api/customers/[userId]/history";
import Input from "src/components/store/Input";
import Dropdown from "src/components/ui/Dropdown";
import clsx from "clsx";
import { toTitleCase } from "src/util/string";
import Link from "src/components/ui/Link";
import { useEffect, useRef, useState } from "react";
import Checkbox from "src/components/ui/Checkbox";
import Button from "src/components/ui/Button";
import axios from "axios";
import { toast } from "react-toastify";

interface Props {
	purchase: AggregatedPurchaseRecordPurchases;
	userId: string;
	close: (bypass: boolean) => void;
}

interface DropdownOptions {
	label: string;
	value: string;
}

export default function DisputeCreator({ purchase, userId, close }: Props) {
	const [reason, setReason] = useState<DropdownOptions>();
	const [refundBody, setRefundBody] = useState("");
	const [acknowledgement, setAcknowledgement] = useState(false);
	const [canSubmit, setCanSubmit] = useState(false);

	const [dropdownOptions, setDropdownOptions] = useState<DropdownOptions[]>([
		{
			label: "Fraud/Unauthorized",
			value: "unauthorized",
		},
		{
			label: "Did not receive goods",
			value: "undelivered",
		},
		{
			label: "Other",
			value: "other",
		},
	]);

	useEffect(() => {
		const options = [...dropdownOptions];
		switch (purchase.type) {
			case "subscription":
				options.splice(1, 0, {
					label: "Unexpected renewal",
					value: "unexpected-renewal",
				});
				break;
			case "single":
				options.splice(1, 0, {
					label: "Duplicate charge",
					value: "double-charge",
				});
				break;
		}
		setDropdownOptions(options);
	}, [purchase.type]);

	useEffect(() => {
		if (refundBody.length >= 100 && refundBody.length <= 2000 && reason && acknowledgement) {
			setCanSubmit(true);
		}
	}, [reason, refundBody, acknowledgement]);

	const submit = async () => {
		if (canSubmit) {
			try {
				await axios({
					url: `/api/customers/${userId}/purchases/${purchase._id}/refund`,
					method: "POST",
					data: {
						gateway: purchase.gateway,
						orderId: purchase._id,
						type: purchase.type,
						reason: reason?.label,
						createdAt: new Date().getTime(),
						content: refundBody,
						...(purchase.subscriptionId && { subscriptionId: purchase.subscriptionId }),
					},
				});
				toast.success("Your refund request has been submitted. Please allow us time to review your request.", {
					theme: "colored",
					position: "top-center",
				});
				close(true);
			} catch (e) {
				toast.error("Unable to submit refund request at this time. Please try again later.", {
					theme: "colored",
					position: "top-center",
				});
			}
		}
	};

	return (
		<div>
			<p
				className="absolute top-4 flex cursor-pointer items-center justify-start space-x-1 text-sm transition-colors dark:text-neutral-400 hover:dark:text-neutral-200"
				onClick={() => close(false)}
			>
				<Iconify icon="akar-icons:arrow-left" />
				<span>Go back to purchase details</span>
			</p>
			<Title size="big">Request a Refund</Title>
			<p className="text-neutral-600 dark:text-neutral-400">
				If you believe that you have been mischarged for this order you are able to fill out this form to
				request a refund.
			</p>
			<div className="mt-5">
				<div className="flex justify-between space-x-5">
					<Input
						width="w-[300px]"
						placeholder="Order ID"
						type="text"
						label="Order ID"
						value={purchase._id}
						className="dark:text-neutral-400"
						required
						disabled
					/>
					<div className="w-2/5">
						<p className="mb-1 text-neutral-600 dark:text-neutral-300">
							Product type<sup className="text-red-500">*</sup>
						</p>
						<div
							className={clsx(
								"flex items-center justify-between",
								"rounded-md border border-[#3C3C3C]",
								"bg-light-500 text-neutral-800 transition-colors dark:bg-black/40 dark:text-neutral-400",
								"w-full px-3 py-2 text-sm"
							)}
						>
							<p>{purchase.items[0].type === "recurring" ? "Subscription" : "One time"}</p>
							<Iconify icon="ic:baseline-expand-more" height={15} className="ml-1" />
						</div>
					</div>
				</div>
				<div className="mt-3">
					<div className="w-2/5">
						<p className="mb-1 text-neutral-600 dark:text-neutral-300">
							Reason for refund
							<sup className="text-red-500">*</sup>
						</p>
						<Dropdown
							content={
								<div
									className={clsx(
										"flex items-center justify-between",
										"rounded-md border border-[#3C3C3C]",
										"bg-light-500 text-neutral-800 transition-colors dark:bg-black/40 dark:text-neutral-400",
										"w-full px-3 py-2 text-sm"
									)}
								>
									<p>{reason ? reason.label : "Select one"}</p>
									<Iconify icon="ic:baseline-expand-more" height={15} className="ml-1" />
								</div>
							}
							options={dropdownOptions.map((option) => {
								return {
									label: option.label,
									onClick: () => setReason(option),
								};
							})}
							isInput={false}
							requireScroll={false}
						/>
					</div>
				</div>
				<div className="relative mt-3">
					<label className="mb-1 text-neutral-600 dark:text-neutral-300">
						Reasoning behind your request<sup className="text-red-500">*</sup>
					</label>
					<textarea
						value={refundBody}
						onChange={(e) => setRefundBody(e.target.value)}
						placeholder={
							"Please explain as in-depth as possible the reasoning for your refund request. Keep in mind that the nicer you are, the more likely we are to give you a full refund."
						}
						className={clsx(
							"h-48 max-h-[450px] min-h-[50px] w-full resize-y rounded-md border px-3 py-2",
							"font-inter text-sm text-neutral-800 dark:text-white",
							"border-neutral-300 focus-visible:border-dank-300 focus-visible:outline-none dark:border-neutral-700 dark:bg-dark-400 placeholder:dark:text-neutral-400"
						)}
					/>
					<span
						className={clsx(
							"absolute bottom-[3px] right-5 bg-white px-1 py-0.5 text-right text-xs dark:bg-dark-400",
							refundBody.length < 100
								? "text-red-400"
								: refundBody.length < 2000
								? "text-neutral-400 dark:text-neutral-500"
								: "text-red-400"
						)}
					>
						{refundBody.length}/{refundBody.length < 100 ? 100 : 2000}
					</span>
				</div>
				<div className="mt-3">
					<Checkbox state={acknowledgement} callback={() => setAcknowledgement((state) => !state)}>
						By submitting this request you acknowledge that you have read and understand our{" "}
						<Link href="/refunds" className="!text-dank-300 underline hover:!text-dank-200">
							refund policy
						</Link>
						.
					</Checkbox>
					<Button
						variant={canSubmit ? "primary" : "dark"}
						disabled={!canSubmit}
						className="mt-2 w-full"
						onClick={submit}
					>
						Submit refund request
					</Button>
				</div>
			</div>
		</div>
	);
}
