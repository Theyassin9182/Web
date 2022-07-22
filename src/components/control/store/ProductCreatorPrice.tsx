import clsx from "clsx";
import { useEffect, useState } from "react";
import Dropdown from "src/components/ui/Dropdown";
import Input from "src/components/store/Input";
import { Icon as Iconify } from "@iconify/react";
import Tooltip from "src/components/ui/Tooltip";
import { billingPeriod } from "src/components/store/cart/CartItem";

interface Props {
	id: string;
	mode: "single" | "subscription" | null;
	value?: string;
	interval?: string;
	intervalCount?: string;
	updatePrice: any;
	deletePrice: any;
}

export default function ProductCreatorPrice({
	id,
	mode,
	value = "",
	interval = "",
	intervalCount = "",
	updatePrice,
	deletePrice,
}: Props) {
	const [price, setPrice] = useState(value);
	const [billingInterval, setBillingInterval] = useState(interval);
	const [billingIntervalCount, setBillingIntervalCount] = useState(intervalCount);

	useEffect(() => {
		updatePrice(id, {
			id,
			value: price,
			interval: billingInterval,
			intervalCount: billingIntervalCount,
		});
	}, [price, billingInterval, billingIntervalCount]);

	return (
		<div className="relative rounded-lg py-5 px-4 dark:bg-dank-500" key={id}>
			<span
				className="absolute right-3 top-2 cursor-pointer text-neutral-500 transition-colors hover:text-red-400"
				onClick={() => deletePrice(id)}
			>
				<Iconify icon="bx:trash" height={18} />
			</span>
			<div className="flex w-full space-x-4">
				<div className="w-1/4">
					<Input
						width="w-full"
						type={"text"}
						placeholder={"9.99"}
						value={value}
						icon={"bi:currency-dollar"}
						className="!pl-8"
						iconSize={16}
						onChange={(e) => {
							if (!Number.isNaN(e.target.value)) {
								setPrice(e.target.value);
							}
						}}
						onBlur={(e) => {
							if (!Number.isNaN(parseFloat(e.target.value))) {
								setPrice(parseFloat(e.target.value).toFixed(2));
							}
						}}
						label={
							<>
								Value
								<sup className="text-red-500">*</sup>
							</>
						}
					/>
				</div>
				{mode === "subscription" && (
					<>
						<div className="w-32">
							<p className="mb-1 text-neutral-600 dark:text-neutral-300">
								Billing interval
								<sup className="text-red-500">*</sup>
							</p>
							<Dropdown
								content={
									<div
										className={clsx(
											"flex items-center justify-between",
											"rounded-md border border-[#3C3C3C]",
											"bg-light-500 transition-colors dark:bg-black/30 dark:text-neutral-400",
											"w-full px-3 py-2 text-sm"
										)}
									>
										<p>{billingInterval.length >= 1 ? billingInterval : "Select one"}</p>
										<Iconify icon="ic:baseline-expand-more" height={15} className="ml-1" />
									</div>
								}
								options={["Daily", "Weekly", "Monthly", "Annually"].map((t) => ({
									label: t,
									onClick: () => setBillingInterval(t),
								}))}
								isInput={false}
								requireScroll={false}
							/>
						</div>
						<div className="w-14">
							<Input
								type={"text"}
								label={
									<p className="flex items-center space-x-1">
										<span>#</span>
										<Tooltip content="Number of intervals">
											<Iconify icon={"ant-design:question-circle-filled"} />
										</Tooltip>
									</p>
								}
								defaultValue="1"
								width="w-full"
								placeholder="1"
								value={billingIntervalCount}
								onChange={(e) =>
									setBillingIntervalCount(
										e.target.value.match(/\d+/) ? e.target.value.match(/\d+/)![0] : ""
									)
								}
							/>
						</div>
					</>
				)}
			</div>
			{mode === "subscription" && (
				<p className="mt-1 text-sm dark:text-neutral-500">
					User will pay <span className="text-dank-300">${value}</span>
					{billingInterval !== "" && (
						<>
							{" "}
							every{" "}
							<span className="text-dank-300">
								{parseInt(billingIntervalCount) > 1 ? billingIntervalCount : ""}{" "}
								{billingPeriod[billingInterval as keyof typeof billingPeriod]}
								{parseInt(billingIntervalCount) > 1 ? "s" : ""}
							</span>
						</>
					)}
				</p>
			)}
		</div>
	);
}
