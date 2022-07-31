import clsx from "clsx";
import { useTheme } from "next-themes";
import Checkbox from "src/components/ui/Checkbox";
import Input from "../Input";
import Button from "src/components/ui/Button";
import Link from "next/link";
import { Stripe } from "@stripe/stripe-js";
import { PaymentRequestButtonElement } from "@stripe/react-stripe-js";
import { useContext, useEffect, useState } from "react";
import { PayPalButton } from "react-paypal-button-v2";
import { useRouter } from "next/router";
import axios from "axios";
import { OrdersRetrieveResponse } from "src/util/paypal/classes/Orders";
import { toast } from "react-toastify";
import { getSelectedPriceValue } from "src/util/store/index";
import { StoreContext } from "src/contexts/StoreProvider";
import { User } from "src/types";
import { useDiscount } from "src/util/hooks/useDiscount";
import { useCart } from "src/util/hooks/useCart";
import { CartItem } from "src/pages/store";
import { STORE_FLAT_DISCOUNT_PERCENTAGE, STORE_MINIMUM_DISCOUNT_VALUE, STORE_TAX_PERCENT } from "src/constants";
import { CheckoutContext } from "src/contexts/CheckoutProvider";

interface Props {
	user?: User;
	stripe: Stripe | null;
	confirmPayment: any;
	completedPayment: any;
	integratedWalletButtonType: "check-out" | "subscribe";
}

export default function AccountInformation({
	user,
	stripe,
	confirmPayment,
	completedPayment,
	integratedWalletButtonType,
}: Props) {
	const router = useRouter();
	const { theme } = useTheme();
	const { cart, isValidating } = useCart();
	const { discount } = useDiscount();
	const storeContext = useContext(StoreContext);
	const checkoutContext = useContext(CheckoutContext);

	const [isGift, setIsGift] = useState(storeContext?.config.isGift);
	const [giftRecipient, setGiftRecipient] = useState(storeContext?.config.giftRecipient);

	const [acceptedTerms, setAcceptedTerms] = useState(false);
	const [paymentOption, setPaymentOption] = useState(checkoutContext?.selectedPaymentOption);

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
	const meetsThreshold = total >= STORE_MINIMUM_DISCOUNT_VALUE && cart[0].type !== "subscription";

	// Remade to fit new store!
	const createPayment = () => {
		// const totalWithTax = (
		// 	parseFloat(itemsTotal) +
		// 	parseFloat(itemsTotal) * 0.0675 -
		// 	(parseFloat(discounts.thresholdDiscount) + discounts.discountedItemsTotalSavings)
		// ).toFixed(2);
		return {
			intent: "CAPTURE", // Capture a payment, no pre-authorization,
			purchase_units: [
				{
					amount: {
						value: total,
						currency_code: "USD",
						breakdown: {
							item_total: {
								currency_code: "USD",
								value: subtotal,
							},
							discount: {
								currency_code: "USD",
								value: (
									total -
									(meetsThreshold ? total * (STORE_FLAT_DISCOUNT_PERCENTAGE / 100) : 0) +
									discount.totalSavings
								).toFixed(2),
							},
						},
					},
					description: "Dank Memer Store",
					custom_id: `${user?.id}:${isGift ? giftRecipient : user?.id}:${isGift}`,
					items: [
						...cart.map((item) => {
							return {
								name: item.name,
								unit_amount: {
									currency_code: "USD",
									value: (getSelectedPriceValue(item, item.selectedPrice).value / 100).toFixed(2),
								},
								quantity: item.quantity.toString(),
								category: "DIGITAL_GOODS",
								sku: `${item.id}:${
									getSelectedPriceValue(item, item.selectedPrice).interval?.period || "single"
								}`,
							};
						}),
						{
							name: "Sales tax",
							unit_amount: {
								currency_code: "USD",
								value: (total * (STORE_TAX_PERCENT / 100)).toFixed(2),
							},
							quantity: "1",
							category: "DIGITAL_GOODS",
							sku: "SALESTAX:single",
						},
					],
				},
			],
			application_context: {
				brand_name: "Dank Memer's Webstore",
				shipping_preference: "NO_SHIPPING",
				user_action: "PAY_NOW",
			},
		};
	};

	const createPayPalSubscription = async (actions: any) => {
		const { data: res } = await axios(`/api/customers/${isGift ? giftRecipient : user?.id}`);

		if (res.isSubscribed && cart[0].type === "subscription") {
			return toast.info(
				<p>
					{isGift ? <>That user</> : <>You</>} already {isGift ? <>has</> : <>have</>} an active subscription.{" "}
					{isGift ? (
						<></>
					) : (
						<>
							If you wish to manage your subscription, you can do so{" "}
							<Link href="/dashboard/@me">
								<a className="underline">here</a>
							</Link>
							.
						</>
					)}
				</p>,
				{
					theme: "colored",
					position: "top-center",
					hideProgressBar: true,
				}
			);
		} else {
			return actions.subscription.create({
				plan_id: getSelectedPriceValue(cart[0], cart[0].selectedPrice).paypalPlan,
				custom_id: `${getSelectedPriceValue(cart[0], cart[0].selectedPrice).paypalPlan}:${user?.id}:${
					giftRecipient || user?.id
				}:${new Date().getTime()}`,
			});
		}
	};

	const approvePayPalSubscription = async (data: any, actions: any) => {
		const subscriptionDetails = await actions.subscription.get();
		paypalSubscriptionSuccess(subscriptionDetails, data);
	};

	const paypalSuccess = (details: OrdersRetrieveResponse, data: any) => {
		const subscriptionGift = isGift && cart[0].type === "subscription";

		axios({
			method: "PATCH",
			url: `/api/store/checkout/finalize/paypal?orderID=${data.orderID}`,
			data: {
				stripeInvoice: checkoutContext?.invoice,
				status: details.status,
				isGift,
				giftFor: giftRecipient,
				...(subscriptionGift && {
					giftSubscription: {
						product: cart[0].id,
						price: cart[0].selectedPrice,
					},
				}),
			},
		}).then(() => {
			router.push(`/store/checkout/success?gateway=paypal&id=${data.orderID}`);
		});
	};

	const paypalSubscriptionSuccess = (details: any, data: any) => {
		axios({
			method: "PATCH",
			url: `/api/store/checkout/finalize/paypal?orderID=${data.orderID}`,
			data: {
				stripeInvoice: checkoutContext?.invoice,
				status: details.status,
				isGift,
				giftFor: giftRecipient,
				subscription: data.subscriptionID,
			},
		}).then(() => {
			router.push(
				`/store/checkout/success?gateway=paypal&id=${data.orderID}&invoice=${checkoutContext?.invoice}`
			);
		});
	};

	useEffect(() => {
		if (!checkoutContext?.integratedWallet || !stripe || !checkoutContext?.clientSecret) return;
		checkoutContext.integratedWallet.once("paymentmethod", async (e) => {
			const { paymentIntent, error: confirmPaymentError } = await stripe.confirmCardPayment(
				checkoutContext.clientSecret!,
				{ payment_method: e.paymentMethod.id },
				{ handleActions: false }
			);

			if (confirmPaymentError) {
				e.complete("fail"); // Inform browser that the payment failed prompting to re-show the payment modal
			} else {
				e.complete("success"); // Payment was successful, let browser close payment modal
				if (paymentIntent?.status === "requires_action") {
					const { error: actionError } = await stripe.confirmCardPayment(checkoutContext.clientSecret!);
					if (actionError) {
						toast.error(
							"There was an issue processing your payment. If you wish to continue, try again using a different payment method.",
							{
								theme: "colored",
								position: "top-center",
							}
						);
					} else {
						completedPayment();
					}
				} else {
					completedPayment();
				}
			}
		});
	}, [checkoutContext?.integratedWallet, stripe, checkoutContext?.clientSecret]);

	useEffect(() => {
		setGiftRecipient(storeContext?.config.giftRecipient);
		setIsGift(storeContext?.config.isGift);
	}, [storeContext?.config]);

	useEffect(() => {
		setPaymentOption(checkoutContext?.selectedPaymentOption);
	}, [checkoutContext?.selectedPaymentOption]);

	return (
		<div className="w-full">
			{paymentOption !== "PayPal" && (
				<h3 className="font-montserrat text-base font-bold text-neutral-700 dark:text-white">
					Account information
				</h3>
			)}
			<div className="mt-3">
				{paymentOption !== "PayPal" && (
					<>
						<p className="text-sm text-neutral-600 dark:text-neutral-500">
							The following email will receive the purchase receipt once the payment has been processed.
						</p>
						<Input
							width="w-60"
							type="email"
							placeholder="support@dankmemer.gg"
							defaultValue={checkoutContext?.receiptEmail}
							onChange={(e: any) => {
								let updatedState = checkoutContext;
								updatedState = { ...checkoutContext, receiptEmail: e.target.value };
								checkoutContext?.update!(updatedState);
							}}
							className="mt-2 !py-1"
						/>
					</>
				)}
				<Checkbox state={acceptedTerms} callback={() => setAcceptedTerms(!acceptedTerms)}>
					I agree to Dank Memer's{" "}
					<Link href="/terms">
						<a className="text-dank-300 underline">Terms of Serivce</a>
					</Link>{" "}
					and{" "}
					<Link href="/refunds">
						<a className="text-dank-300 underline">Refund Policy</a>
					</Link>
					.
				</Checkbox>
				{checkoutContext &&
					(checkoutContext.acceptsIntegratedWallets &&
					checkoutContext.integratedWallet !== null &&
					checkoutContext.selectedPaymentOption !== "Card" &&
					checkoutContext.selectedPaymentOption !== "PayPal" ? (
						checkoutContext.receiptEmail!.length >= 5 && acceptedTerms ? (
							<div className="mt-3">
								<PaymentRequestButtonElement
									options={{
										paymentRequest: checkoutContext.integratedWallet!,
										style: {
											paymentRequestButton: {
												type: integratedWalletButtonType,
												theme: theme === "dark" ? "dark" : "light",
											},
										},
									}}
								/>
							</div>
						) : (
							<div className="mt-3 h-10 w-full rounded-md dark:bg-white/10"></div>
						)
					) : checkoutContext.selectedPaymentOption === "PayPal" ? (
						<div className="mt-3 h-[50px] w-full overflow-hidden dark:text-white">
							{acceptedTerms ? (
								cart[0].type === "subscription" && !isGift ? (
									<PayPalButton
										options={{
											vault: true,
											clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
										}}
										style={{
											height: 40,
											fontFamily: "'Inter', sans-serif",
											layout: "horizontal",
											color: theme === "dark" ? "black" : "silver",
											tagline: false,
										}}
										createSubscription={(_: any, actions: any) => createPayPalSubscription(actions)}
										onApprove={(data: any, actions: any) => {
											approvePayPalSubscription(data, actions);
										}}
										catchError={(err: any) => {
											toast.error("Something went wrong while processing your request.");
										}}
										onError={(err: any) => {
											toast.error("Failed to checkout.");
										}}
									/>
								) : cart[0].type === "subscription" && isGift ? (
									<PayPalButton
										options={{
											clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
										}}
										style={{
											height: 40,
											fontFamily: "'Inter', sans-serif",
											layout: "horizontal",
											color: theme === "dark" ? "black" : "silver",
											tagline: false,
										}}
										createOrder={(_: any, actions: any) => actions.order.create(createPayment())}
										onApprove={(_: any, actions: any) => actions.order.capture()}
										onSuccess={(details: any, data: any) => paypalSuccess(details, data)}
									/>
								) : (
									<PayPalButton
										options={{
											clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
										}}
										style={{
											height: 40,
											fontFamily: "'Inter', sans-serif",
											layout: "horizontal",
											color: theme === "dark" ? "black" : "silver",
											tagline: false,
										}}
										createOrder={(_: any, actions: any) => actions.order.create(createPayment())}
										onApprove={(_: any, actions: any) => actions.order.capture()}
										onSuccess={(details: any, data: any) => paypalSuccess(details, data)}
									/>
								)
							) : (
								<div className="h-10 w-full rounded-md dark:bg-white/10"></div>
							)}
						</div>
					) : (
						<Button
							size="medium-large"
							className={clsx(
								"mt-3 w-full",
								!(
									checkoutContext.canCheckout &&
									checkoutContext.receiptEmail!.length >= 5 &&
									acceptedTerms
								)
									? "bg-neutral-400 text-neutral-600 dark:bg-neutral-500 dark:text-neutral-800"
									: ""
							)}
							disabled={
								!(
									checkoutContext.canCheckout &&
									checkoutContext.receiptEmail!.length >= 5 &&
									acceptedTerms
								)
							}
							onClick={() => confirmPayment(isGift, giftRecipient, checkoutContext.receiptEmail!)}
						>
							{checkoutContext.processingPayment ? (
								<p className="flex">
									<span className="mr-3">
										<svg
											width="23"
											height="23"
											viewBox="0 0 38 38"
											xmlns="http://www.w3.org/2000/svg"
										>
											<defs>
												<linearGradient x1="8.042%" y1="0%" x2="65.682%" y2="23.865%" id="a">
													<stop stopColor="#fff" stopOpacity="0" offset="0%" />
													<stop stopColor="#fff" stopOpacity=".631" offset="63.146%" />
													<stop stopColor="#fff" offset="100%" />
												</linearGradient>
											</defs>
											<g fill="none" fill-rule="evenodd">
												<g transform="translate(1 1)">
													<path
														d="M36 18c0-9.94-8.06-18-18-18"
														id="Oval-2"
														stroke="url(#a)"
														strokeWidth="2"
													>
														<animateTransform
															attributeName="transform"
															type="rotate"
															from="0 18 18"
															to="360 18 18"
															dur="0.9s"
															repeatCount="indefinite"
														/>
													</path>
													<circle fill="#fff" cx="36" cy="18" r="1">
														<animateTransform
															attributeName="transform"
															type="rotate"
															from="0 18 18"
															to="360 18 18"
															dur="0.9s"
															repeatCount="indefinite"
														/>
													</circle>
												</g>
											</g>
										</svg>
									</span>
									Processing payment...
								</p>
							) : (
								<p>
									Pay ${total.toFixed(2)} with {checkoutContext.selectedPaymentOption}
								</p>
							)}
						</Button>
					))}
			</div>
		</div>
	);
}
