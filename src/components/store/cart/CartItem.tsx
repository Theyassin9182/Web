import { Icon as Iconify } from "@iconify/react";
import clsx from "clsx";
import { useEffect } from "react";
import Dropdown from "src/components/ui/Dropdown";
import { CartItem as CartItems } from "src/pages/store";

import { toTitleCase } from "src/util/string";

interface Props extends CartItems {
	index: number;
	size: "small" | "large";
	updateQuantity: any;
	changeInterval: any;
	deleteItem: any;
	disabled: boolean;
}

export default function CartItem({
	index,
	size = "large",
	name,
	selectedPrice,
	quantity,
	metadata,
	image,
	updateQuantity,
	changeInterval,
	deleteItem,
	disabled,
}: Props) {
	const setQuantity = (value: any) => {
		const quantity = parseInt(value);
		if (isNaN(quantity)) return;
		if (quantity < 1 || quantity > 100) return;
		updateQuantity(index, quantity);
	};

	return (
		<div className="mt-3 flex w-full items-center justify-between">
			<div className="flex">
				<div
					className={clsx(
						"rounded-md bg-black/10 bg-center bg-no-repeat dark:bg-black/30",
						size === "small"
							? "h-[36px] min-w-[36px] bg-[length:20px_20px]"
							: "h-12 w-12 bg-[length:33px_33px]"
					)}
					style={{
						backgroundImage: `url('${image}')`,
					}}
				></div>
				<div
					className={clsx(
						"flex flex-col justify-center",
						size === "small" ? "ml-2" : "ml-5"
					)}
				>
					<h4
						className={clsx(
							"min-w-max font-bold leading-none text-gray-800 dark:text-white",
							size === "small" ? "text-xs" : "text-base"
						)}
					>
						{name}
					</h4>
					<p className="text-xs leading-none text-light-600">
						{metadata?.type && toTitleCase(metadata?.type)}
					</p>
				</div>
			</div>
			<div className={clsx("flex items-center justify-center")}>
				<div className={clsx(size === "small" ? "mr-5" : "mr-16")}>
					{metadata?.type === "membership" ? (
						<Dropdown
							content={
								<div
									className={clsx(
										"flex items-center justify-center rounded-md border-[1px] border-[#3C3C3C] bg-[#0C120D] transition-colors dark:text-[#707070] hover:dark:text-[#cccccc]",
										size === "small"
											? "px-2 py-1 text-xs"
											: "px-3 py-[6px] text-sm"
									)}
								>
									<p>
										{selectedPrice.interval! === "year"
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
							options={
								selectedPrice.interval === "month"
									? [
											{
												onClick: () => {
													changeInterval(
														index,
														"year"
													);
												},
												label:
													size === "small"
														? "Annually"
														: "Annual subscription",
											},
									  ]
									: [
											{
												onClick: () => {
													changeInterval(
														index,
														"month"
													);
												},
												label:
													size === "small"
														? "Monthly"
														: "Monthly subscription",
											},
									  ]
							}
						/>
					) : (
						<div className="flex items-center justify-center">
							<div
								className={clsx(
									"group grid h-6 w-6 cursor-pointer place-items-center rounded transition-colors",
									size === "small" ? "" : "mr-2",
									!disabled && "dark:hover:bg-white/10",
									disabled && "cursor-not-allowed"
								)}
								onClick={() => setQuantity(quantity - 1)}
							>
								<Iconify
									icon="ant-design:minus-outlined"
									height={size === "small" ? "13" : "15"}
									className="text-gray-800 group-hover:!text-white dark:text-gray-400"
								/>
							</div>
							<input
								type="text"
								className={clsx(
									"w-10 rounded bg-transparent text-center text-black focus-visible:outline-none dark:text-white",
									size === "small" ? "text-sm" : "text-base",
									!disabled &&
										"dark:focus-within:bg-white/10",
									disabled && "cursor-not-allowed"
								)}
								value={quantity}
								onChange={(e) => setQuantity(e.target.value)}
								disabled={disabled}
							/>
							<div
								className={clsx(
									"group grid h-6 w-6 cursor-pointer place-items-center rounded transition-colors",
									size === "small" ? "" : "ml-2",
									!disabled && "dark:hover:bg-white/10",
									disabled && "cursor-not-allowed"
								)}
								onClick={() => setQuantity(quantity + 1)}
							>
								<Iconify
									icon="ant-design:plus-outlined"
									height={size === "small" ? "13" : "15"}
									className="cursor-pointer text-gray-800 hover:!text-white dark:text-gray-400"
								/>
							</div>
						</div>
					)}
				</div>
				<p
					className={clsx(
						"mr-7 text-right font-montserrat font-bold text-gray-800 dark:text-white",
						size === "small"
							? "min-w-[50px] text-sm"
							: "min-w-[70px] text-base"
					)}
				>
					${((selectedPrice.price / 100) * quantity).toFixed(2)}
				</p>
				<Iconify
					icon="bx:bx-trash"
					height={size === "small" ? "15" : "20"}
					className="cursor-pointer text-gray-800 transition-colors hover:!text-red-400 dark:text-gray-200"
					onClick={deleteItem}
				/>
			</div>
		</div>
	);
}