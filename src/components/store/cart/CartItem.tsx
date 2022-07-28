import { Icon as Iconify } from "@iconify/react";
import clsx from "clsx";
import { useEffect, useState } from "react";
import Dropdown from "src/components/ui/Dropdown";
import { CartItem as CartItems } from "src/pages/store";
import { useHasMap } from "src/util/hooks/useHasMap";
import { toTitleCase } from "src/util/string";

interface Props extends CartItems {
	index: number;
	size: "small" | "large";
	changeInterval: any;
	setQuantity: (id: string, number: number) => void;
	increaseQuantity: (id: string, number?: number) => void;
	decreaseQuantity: (id: string, number?: number) => void;
	deleteItem: (id: string) => void;
	disabled: boolean;
	shouldShake?: boolean;
}

export const billingPeriod = {
	day: "Daily",
	week: "Weekly",
	month: "Monthly",
	year: "Annually",
};

export default function CartItem({
	id,
	size = "large",
	name,
	type,
	prices,
	selectedPrice,
	quantity,
	image,
	changeInterval,
	setQuantity,
	increaseQuantity,
	decreaseQuantity,
	deleteItem,
	disabled,
	shouldShake = false,
}: Props) {
	const [shake, setShake] = useState(shouldShake);
	const price = () => {
		if (!prices) return;
		return prices.find((price) => price.id === selectedPrice)!;
	};

	// const setQuantity = (value: any) => {
	// 	const quantity = parseInt(value);
	// 	if (isNaN(quantity)) return;
	// 	if (quantity < 1 || quantity > 100) {
	// 		setShake(true);
	// 		setTimeout(() => {
	// 			setShake(false);
	// 		}, 820);
	// 	} else {
	// 		updateQuantity(index, quantity);
	// 	}
	// };

	useEffect(() => {
		if (shouldShake) {
			setShake(true);
			setTimeout(() => {
				setShake(false);
			}, 820);
		}
	}, [shouldShake]);

	return (
		<div
			className={clsx(
				shake && "animate-shake border border-red-500/40",
				"mt-3 flex w-full flex-col items-start justify-between space-x-0 rounded-md border border-transparent sm:flex-row sm:items-center"
			)}
		>
			<div className="flex w-full items-center justify-between sm:w-1/2">
				<div className="flex items-center">
					<div
						className={clsx(
							"rounded-md bg-black/10 bg-center bg-no-repeat dark:bg-black/30",
							size === "small"
								? "h-9 min-w-[36px] bg-[length:20px_20px]"
								: "h-12 w-12 bg-[length:33px_33px]"
						)}
						style={{
							backgroundImage: `url('${image}')`,
						}}
					></div>
					<div className={clsx("flex flex-col justify-center", size === "small" ? "ml-2" : "ml-5")}>
						<h4
							className={clsx(
								"min-w-max font-bold leading-none text-gray-800 dark:text-white",
								size === "small" ? "text-xs" : "text-sm sm:text-base"
							)}
						>
							{name}
						</h4>
						<p className="text-xs leading-none text-light-600">{type && toTitleCase(type)}</p>
					</div>
				</div>
				<Iconify
					icon="bx:bx-trash"
					height={size === "small" ? "15" : "20"}
					className="mr-2.5 inline w-4 cursor-pointer text-gray-800 transition-colors hover:!text-red-400 dark:text-gray-200 sm:hidden sm:w-auto"
					onClick={() => deleteItem(id)}
				/>
			</div>
			<div
				className={clsx(
					size !== "small" && type !== "subscription" && "ml-14",
					"float-right flex w-full items-center justify-between sm:w-auto"
				)}
			>
				<div
					className={clsx(size === "small" ? "mr-5" : "mx-2 w-1/2" && type !== "subscription" && "sm:mr-16")}
				>
					{type === "subscription" ? (
						<Dropdown
							content={
								<div
									className={clsx(
										"flex items-center justify-center rounded-md border border-neutral-700 bg-dark-400 transition-colors dark:text-neutral-500 hover:dark:text-neutral-300",
										size === "small" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-xs xl:text-sm"
									)}
								>
									<p>
										{price()?.interval?.period === "year"
											? size === "small"
												? "Annually"
												: "Annual subscription"
											: size === "small"
											? "Monthly"
											: "Monthly subscription"}
									</p>
									<Iconify
										icon="ic:baseline-expand-more"
										height={size === "small" ? "13" : "15"}
										className="ml-1"
									/>
								</div>
							}
							options={[...prices.values()].map((p) => ({
								label:
									size !== "small"
										? (p.interval!.period === "year"
												? "Annual"
												: billingPeriod[p.interval!.period]) + " subscription"
										: billingPeriod[p.interval!.period],
								onClick: () => changeInterval(id, p.interval!.period),
							}))}
						/>
					) : (
						<div className="flex items-center justify-center">
							<div
								className={clsx(
									"group grid h-4 w-4 cursor-pointer place-items-center rounded transition-colors sm:h-6 sm:w-6",
									size === "small" ? "" : "mr-1 sm:mr-2",
									!disabled && "dark:hover:bg-white/10",
									disabled && "cursor-not-allowed"
								)}
								onClick={() => quantity - 1 >= 1 && decreaseQuantity(id)}
							>
								<Iconify
									icon="ant-design:minus-outlined"
									height={size === "small" ? "13" : "15"}
									className="w-4 text-gray-800 group-hover:!text-white dark:text-gray-400 sm:w-auto"
								/>
							</div>
							<input
								type="text"
								className={clsx(
									"w-8 rounded bg-transparent text-center text-black focus-visible:outline-none dark:text-white sm:w-10",
									size === "small" ? "text-sm" : "text-sm sm:text-base",
									!disabled && "dark:focus-within:bg-white/10",
									disabled && "cursor-not-allowed"
								)}
								value={quantity}
								onChange={(e) => setQuantity(id, parseInt(e.target.value) ?? 1)}
								disabled={disabled}
							/>
							<div
								className={clsx(
									"group grid h-4 w-4 cursor-pointer place-items-center rounded transition-colors sm:h-6 sm:w-6",
									size === "small" ? "" : "ml-1 sm:ml-2",
									!disabled && "dark:hover:bg-white/10",
									disabled && "cursor-not-allowed"
								)}
								onClick={() => increaseQuantity(id)}
							>
								<Iconify
									icon="ant-design:plus-outlined"
									height={size === "small" ? "13" : "15"}
									className="w-4 cursor-pointer text-gray-800 hover:!text-white dark:text-gray-400 sm:w-auto"
								/>
							</div>
						</div>
					)}
				</div>
				<p
					className={clsx(
						"mr-3 text-right font-montserrat font-semibold text-gray-800 dark:text-white sm:mr-7",
						size === "small" ? "min-w-[50px] text-sm" : "min-w-[70px] text-sm sm:text-base"
					)}
				>
					${(((price()?.value ?? 100) / 100) * quantity).toFixed(2)}
				</p>
				<Iconify
					icon="bx:bx-trash"
					height={size === "small" ? "15" : "20"}
					className="hidden w-4 cursor-pointer text-gray-800 transition-colors hover:!text-red-400 dark:text-gray-200 sm:inline sm:w-auto"
					onClick={() => deleteItem(id)}
				/>
			</div>
		</div>
	);
}
