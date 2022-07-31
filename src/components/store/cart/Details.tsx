import clsx from "clsx";
import { useRouter } from "next/router";
import { useContext, useEffect, useRef, useState } from "react";
import { Title } from "src/components/Title";
import Button from "src/components/ui/Button";
import Tooltip from "src/components/ui/Tooltip";
import { STORE_FLAT_DISCOUNT_PERCENTAGE, STORE_MINIMUM_DISCOUNT_VALUE, STORE_TAX_PERCENT } from "src/constants";
import { CartItem } from "src/pages/store";
import { useCart } from "src/util/hooks/useCart";
import { useDiscount } from "src/util/hooks/useDiscount";
import { getSelectedPriceValue } from "src/util/store";
import Input from "../Input";
import { Icon as Iconify } from "@iconify/react";
import { StoreContext } from "src/contexts/StoreProvider";
import axios from "axios";

interface Props {
	userId: string;
	acceptDiscounts: boolean;
}

export default function CartDetails({ userId, acceptDiscounts }: Props) {
	const router = useRouter();
	const { cart } = useCart();
	const { discount, mutate, isValidating } = useDiscount();
	const context = useContext(StoreContext);

	const previousCart = useRef(cart);
	const [processing, setProcessing] = useState(false);
	const [validGiftRecipient, setValidGiftRecipient] = useState(true);
	const [discountInput, setDiscountInput] = useState(discount.code);
	const [error, setError] = useState("");

	useEffect(() => {
		setValidGiftRecipient(
			context?.config.giftRecipient !== "" && validateGiftRecipient(context?.config.giftRecipient ?? "")
		);
	}, [context?.config.giftRecipient]);

	useEffect(() => {
		(async () => {
			if (!cart || cart.length < 1) return;
			const diff = cart.filter((x) => !previousCart.current.includes(x));
			previousCart.current = cart;
			const discountCode = context?.discountContext.discount.code;
			if (discountCode && discountCode.length >= 1 && diff.length >= 1) {
				setProcessing(true);
				await mutate.recalculate(discount, previousCart.current);
				setProcessing(false);
			}
		})();
	}, [cart]);

	// useEffect(() => {
	// 	if (!isValidating && processing) setProcessing(false);
	// }, [isValidating, processing]);

	useEffect(() => {
		if (error.length >= 1) setError("");
	}, [discountInput]);

	const validateGiftRecipient = (recipient: string) =>
		/^\d{16,21}$/.test(recipient) && context?.config.giftRecipient !== userId;
	const subtotal =
		!isValidating && cart.length >= 1
			? cart.reduce(
					(acc: number, item: CartItem) =>
						acc + ((getSelectedPriceValue(item, item.selectedPrice)?.value ?? 100) / 100) * item.quantity,
					0
			  )
			: 0;
	const salesTax = subtotal * (STORE_TAX_PERCENT / 100);
	const total = subtotal + salesTax - discount.totalSavings;
	const meetsThreshold = total >= STORE_MINIMUM_DISCOUNT_VALUE && acceptDiscounts;

	return (
		<div className="h-max w-full rounded-lg bg-light-500 px-8 py-7 dark:bg-dark-200 md:mr-10 lg:my-5 lg:mr-10">
			<Title size="small">Details</Title>
			<p className="mt-2 font-inter text-sm leading-tight text-neutral-700/80 dark:text-light-600">
				Checkout is completed in USD, bank or card fees may apply to international payments. The total below is
				what is required to be paid upon checkout.
			</p>
			<div className="mt-3 mr-9 w-full">
				<div className="">
					<h3 className="font-montserrat text-base font-semibold text-black dark:text-white">
						Purchase recipient
					</h3>
					<div className="my-2 flex flex-col">
						<div className="mr-4 flex cursor-pointer select-none text-sm">
							<p
								className={clsx(
									!context?.config.isGift
										? "bg-dank-300 text-white"
										: "bg-black/10 text-neutral-600 dark:bg-black/30 dark:text-neutral-400",
									"rounded-l-md border border-transparent px-3 py-1"
								)}
								onClick={() => context?.setConfig((config) => ({ ...config, isGift: false }))}
							>
								Myself
							</p>
							<p
								className={clsx(
									context?.config.isGift
										? "bg-dank-300 text-white"
										: "bg-black/10 text-neutral-600 dark:bg-black/30 dark:text-neutral-400",
									"rounded-r-md border border-transparent px-3 py-1"
								)}
								onClick={() => {
									let config = context?.config;
									config = { ...config, isGift: true };
									context?.setConfig({ ...config });
								}}
							>
								Someone else
							</p>
						</div>
						{context?.config.isGift && (
							<div className="mt-2">
								<Input
									width="w-full max-w-xs"
									type="text"
									placeholder="270904126974590976"
									className={clsx(
										"!py-1 dark:placeholder:text-neutral-500",
										!validGiftRecipient &&
											context?.config.giftRecipient !== "" &&
											"!border-red-500 dark:!border-red-500"
									)}
									value={context?.config.giftRecipient}
									onChange={(e: any) => {
										if (/^\d+$/.test(e.target.value) || e.target.value === "") {
											let config = context?.config;
											config = { ...config, giftRecipient: e.target.value };
											context?.setConfig(config);
										}
									}}
									onBlur={(e) => {
										if (validateGiftRecipient(e.target.value)) {
											let config = context?.config;
											config = { ...config, giftRecipient: e.target.value };
											context?.setConfig(config);
										}
									}}
								/>
							</div>
						)}
					</div>
				</div>
				{(isValidating ? true : acceptDiscounts) && (
					<>
						<h3 className="font-montserrat text-base font-semibold text-black dark:text-white">
							Apply a discount code
						</h3>
						<div className="group mt-2">
							<div className="flex flex-col justify-between text-black dark:text-white">
								<div>
									<div className="mb-4">
										<div className="flex flex-row">
											<Input
												width="medium"
												type="text"
												placeholder="NEWSTORE5"
												value={discountInput}
												className="mr-3"
												onChange={(e: any) => setDiscountInput(e.target.value)}
											/>
											<Button
												size="medium"
												className={clsx(
													"w-full max-w-max rounded-md",
													discount.code === discountInput &&
														discountInput !== "" &&
														"bg-red-500"
												)}
												onClick={
													discount.code.length >= 1
														? () => mutate.clear()
														: async () => {
																try {
																	await mutate.apply(discountInput);
																} catch (e) {
																	setError(e as string);
																}
														  }
												}
												disabled={discountInput?.length < 1}
											>
												{discount.code.length >= 1 && discount.code === discountInput
													? "Clear"
													: "Submit"}
											</Button>
										</div>
										{error && error.length > 1 && (
											<p className="text-right text-sm text-red-500">{error}</p>
										)}
									</div>
									{(discount.code.length >= 1 || meetsThreshold) && (
										<div>
											<div className="flex items-center justify-between">
												<h3 className="font-montserrat text-base font-bold">Discount</h3>

												<h3 className="font-montserrat text-base font-bold text-[#0FA958] drop-shadow-[0px_0px_4px_#0FA95898]">
													-$
													{(
														discount.totalSavings +
														(meetsThreshold
															? total * (STORE_FLAT_DISCOUNT_PERCENTAGE / 100)
															: 0)
													).toFixed(2)}
												</h3>
											</div>
											{(discount.discountedItems.length >= 1 || meetsThreshold) && (
												<div>
													<ul className="pl-3">
														{discount.discountedItems.map((item) => {
															const cartItem = cart.filter(
																(_item) => _item.id === item.id
															)[0];
															return (
																<li
																	key={item.id}
																	className="flex list-decimal justify-between text-sm"
																>
																	<p className="dark:text-neutral-400">
																		• {cartItem.quantity}x {cartItem.name}
																	</p>
																	<p className="text-[#0FA958] drop-shadow-[0px_0px_4px_#0FA95898]">
																		-$
																		{item.savings.toFixed(2)}
																	</p>
																</li>
															);
														})}
														{meetsThreshold && (
															<li className="flex list-decimal items-center justify-between text-sm">
																<p className="flex items-center justify-center space-x-1 dark:text-neutral-400">
																	<span>• Threshold discount</span>
																	<Tooltip content="10% Discount applied because base cart value exceeds $20">
																		<Iconify icon="ant-design:question-circle-filled" />
																	</Tooltip>
																</p>
																<p className="text-[#0FA958] drop-shadow-[0px_0px_4px_#0FA95898]">
																	-$
																	{(
																		total *
																		(STORE_FLAT_DISCOUNT_PERCENTAGE / 100)
																	).toFixed(2)}
																</p>
															</li>
														)}
													</ul>
												</div>
											)}
										</div>
									)}
								</div>
							</div>
						</div>
					</>
				)}
			</div>
			<div className="mt-3">
				<p className="text-right text-sm text-neutral-600 dark:text-neutral-300/50">
					Added sales tax: ${salesTax.toFixed(2)}
				</p>
				<div className="flex w-full items-center justify-between rounded-lg bg-neutral-300 px-4 py-3 dark:bg-dank-500">
					<Title size="small">Total:</Title>
					<Title size="small">
						${(total - (meetsThreshold ? total * (STORE_FLAT_DISCOUNT_PERCENTAGE / 100) : 0)).toFixed(2)}
					</Title>
				</div>
			</div>

			<Button
				size="medium"
				className="mt-3 w-full"
				onClick={() => router.push("/store/checkout")}
				disabled={context?.config.isGift && !validGiftRecipient}
			>
				Continue to Checkout
			</Button>
		</div>
	);
}
