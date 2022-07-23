import { CardCvcElement, CardExpiryElement, CardNumberElement, useElements, useStripe } from "@stripe/react-stripe-js";
import {
	CanMakePaymentResult,
	PaymentRequest,
	StripeCardCvcElementChangeEvent,
	StripeCardExpiryElementChangeEvent,
	StripeCardNumberElementChangeEvent,
} from "@stripe/stripe-js";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { Title } from "src/components/Title";
import { CartItem } from "src/pages/store";
import { DiscountItem } from "src/pages/store/checkout";
import Input from "../Input";
import PaymentOption from "./PaymentOption";
import router from "next/router";
import Checkbox from "src/components/ui/Checkbox";
import ApplyPaySvg from "public/img/store/apple-pay.svg";
import GooglePaySvg from "public/img/store/google-pay.svg";
import PaymentMethods from "./PaymentMethods";
import AccountInformation from "./AccountInformation";
import Tooltip from "src/components/ui/Tooltip";
import { Icon as Iconify } from "@iconify/react";
import clsx from "clsx";
import { toast } from "react-toastify";
import Link from "next/link";
import Image from "next/image";
import { getSelectedPriceValue } from "src/util/store";

interface Props {
	clientSecret: string;
	invoiceId: string;
	userId: string;
	userEmail: string;
	itemsTotal: string;
	subtotalCost: string;
	cart: CartItem[];
	gift: {
		isGift: boolean;
		giftFor: string;
	};
}

export interface Card {
	brand: string;
	type: string;
	expiry: {
		month: number;
		year: number;
	};
	last4: number;
	expired: boolean;
}

export interface CardData {
	id: string;
	card: Card;
}

const StripeInputBaseStyles =
	"mt-1 px-3 py-2 border bg-white border-neutral-300 dark:border-neutral-700 dark:bg-black/30 rounded-md focus:border-dank-300";

export default function CheckoutForm({
	clientSecret,
	invoiceId,
	userId,
	userEmail,
	itemsTotal,
	subtotalCost,
	gift,
	cart,
}: Props) {
	const _invoiceId = useRef(invoiceId);
	const _clientSecret = useRef(clientSecret);
	const successfulCheckout = useRef(false);

	const [totalCost, setTotalCost] = useState<string>("0.00");
	const [processingPayment, setProcessingPayment] = useState(false);
	const [selectedPaymentOption, setSelectedPaymentOption] = useState<
		"Card" | "PayPal" | "ApplePay" | "GooglePay" | "MicrosoftPay"
	>("Card");
	const [acceptsIntegratedWallet, setAcceptsIntegratedWallet] = useState(false);
	const [integratedWalletType, setIntegratedWalletType] = useState<"apple" | "google" | "microsoft" | null>(null);
	const [integratedWallet, setIntegratedWallet] = useState<PaymentRequest | null>(null);

	const [defaultPaymentMethod, setDefaultPaymentMethod] = useState<CardData>();
	const [savedPaymentMethods, setSavedPaymentMethods] = useState<CardData[]>();
	const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(""); // Payment method ID

	const [nameOnCard, setNameOnCard] = useState("");
	const stripe = useStripe();
	const stripeElements = useElements();

	// Stripe input states
	const [cardNumberInput, setCardNumberInput] = useState<StripeCardNumberElementChangeEvent>();
	const [cardExpiryInput, setCardExpiryInput] = useState<StripeCardExpiryElementChangeEvent>();
	const [cardCvcInput, setCardCvcInput] = useState<StripeCardCvcElementChangeEvent>();

	const [saveCardAsDefault, setSaveCardAsDefault] = useState(false);

	const [thresholdDiscount, setThresholdDiscount] = useState(
		parseFloat(subtotalCost) >= 20 && cart[0].type !== "subscription"
	);
	const [appliedDiscountCode, setAppliedDiscountCode] = useState("");
	const [discountedItems, setDiscountedItems] = useState<DiscountItem[]>([]);
	const [appliedSavings, setAppliedSavings] = useState(0);
	const [appliedDiscount, setAppliedDiscount] = useState(false);

	const [receiptEmail, setReceiptEmail] = useState(userEmail);

	const [canCheckout, setCanCheckout] = useState(false);

	useEffect(() => {
		axios("/api/store/discount/get")
			.then(({ data }) => {
				if (!data) return setAppliedDiscount(false);

				const { code, discountedItems, totalSavings } = data;
				if (!code || !discountedItems || !totalSavings) return;

				setAppliedDiscountCode(code);
				setDiscountedItems(discountedItems);
				setAppliedSavings(totalSavings);
				setAppliedDiscount(true);
			})
			.catch(() => {});

		axios(`/api/customers/${userId}?sensitive=true`)
			.then(({ data }) => {
				if (data.cards.default) {
					setDefaultPaymentMethod(data.cards.default);
					setSelectedPaymentMethod(data.cards.default);
				}
				if (data.cards.other) setSavedPaymentMethods(data.cards.other);
			})
			.catch(() => {});

		window.addEventListener("beforeunload", (e) => {
			e.preventDefault();
			return cancelInvoiceAndPayment();
		});

		return () => {
			cancelInvoiceAndPayment();
		};
	}, []);

	useEffect(() => {
		_invoiceId.current = invoiceId;
	}, [invoiceId]);

	useEffect(() => {
		_clientSecret.current = clientSecret;
	}, [clientSecret]);

	useEffect(() => {
		setupIntegratedWallet();
	}, [stripe, totalCost]);

	useEffect(() => {
		const numSubCost = parseFloat(subtotalCost);
		const totalAfterSavings = numSubCost - appliedSavings;
		setThresholdDiscount(totalAfterSavings >= 20 && cart[0].type !== "subscription");
		setTotalCost(
			(
				totalAfterSavings -
				(totalAfterSavings >= 20 && cart[0].type !== "subscription" ? totalAfterSavings * 0.1 : 0)
			).toFixed(2)
		);
	}, [subtotalCost, appliedSavings]);

	useEffect(() => {
		if (
			(nameOnCard.length >= 1 &&
				cardNumberInput?.complete &&
				cardExpiryInput?.complete &&
				cardCvcInput?.complete) ||
			selectedPaymentMethod !== ""
		)
			setCanCheckout(true);
		else setCanCheckout(false);
	}, [nameOnCard, cardNumberInput, cardExpiryInput, cardCvcInput, selectedPaymentMethod]);

	useEffect(() => {
		if (selectedPaymentMethod !== "") setSelectedPaymentMethod("");
	}, [nameOnCard, cardNumberInput, cardExpiryInput, cardCvcInput]);

	const cancelInvoiceAndPayment = () => {
		if (!successfulCheckout.current) {
			axios(`/api/store/checkout/cancel?invoice=${_invoiceId.current}`).catch(() => {
				console.error("Failed to cancel payment. Continuing session uninterrupted.");
			});
		}
	};

	const setupIntegratedWallet = async () => {
		if (!stripe || totalCost === "0.00" || totalCost === "NaN") return;
		const paymentRequest = stripe!.paymentRequest({
			country: "US",
			currency: "usd",
			total: {
				label: `Dank Memer store purchase`,
				amount: Math.floor(parseFloat(totalCost) * 100),
			},
			displayItems: cart.map((item) => ({
				label: `${item.quantity}x ${item.name}`,
				amount: item.quantity * getSelectedPriceValue(item, item.selectedPrice).value,
			})),
			requestPayerName: true,
		});

		const canMakePayment: CanMakePaymentResult | null = await paymentRequest.canMakePayment();
		console.log(canMakePayment);

		if (!canMakePayment) return;
		setAcceptsIntegratedWallet(true);
		if (canMakePayment.applePay) setIntegratedWalletType("apple");
		else if (canMakePayment.googlePay) setIntegratedWalletType("google");
		setIntegratedWallet(paymentRequest);
	};

	const confirmPayment = async (isGift: Boolean, giftFor: string, receiptEmail: string) => {
		if (!stripe || !stripeElements || !canCheckout) return;
		setProcessingPayment(true);

		const { data: res } = await axios(`/api/customers/${isGift ? giftFor : userId}`);

		if (res.isSubscribed && cart[0].type === "subscription") {
			setProcessingPayment(false);
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
		}

		const result = await stripe.confirmCardPayment(clientSecret, {
			setup_future_usage: saveCardAsDefault ? "off_session" : null,
			receipt_email: receiptEmail,
			payment_method:
				selectedPaymentMethod.length > 1
					? selectedPaymentMethod
					: {
							card: stripeElements.getElement("cardNumber")!,
					  },
		});

		if (result.error) {
			setProcessingPayment(false);
			toast.error(result.error.message, {
				position: "top-center",
				theme: "colored",
				hideProgressBar: true,
			});
		} else {
			completedPayment(isGift, giftFor);
		}
	};

	const completedPayment = (isGift: Boolean, giftFor: string) => {
		successfulCheckout.current = true;
		axios({
			method: "PATCH",
			url: `/api/store/checkout/finalize/stripe?invoice=${invoiceId}`,
			data: {
				customerName: nameOnCard,
				receiptEmail,
				isGift,
				giftFor,
			},
		})
			.then(() => {
				setProcessingPayment(false);
			})
			.finally(() => {
				router.push(`/store/checkout/success?gateway=stripe&id=${invoiceId}`);
			});
	};

	return (
		<div className="relative min-w-[58.33%]">
			<div className="h-max w-full rounded-lg bg-light-500 px-8 py-7 dark:bg-dark-200">
				<div className="mb-4">
					<Title size="small">Payment Method</Title>
					<div className="mt-3 flex flex-wrap justify-start gap-y-3">
						<PaymentOption
							icons={["visa", "mastercard", "amex", "discover"].map((card) => (
								<Image src={`/img/store/cards/${card}.svg`} key={card} width={26} height={20} />
							))}
							selected={selectedPaymentOption === "Card"}
							select={() => setSelectedPaymentOption("Card")}
						/>
						<PaymentOption
							icons={[<img key="paypal" src="/img/store/paypal.png" width={70} />]}
							selected={selectedPaymentOption === "PayPal"}
							select={() => setSelectedPaymentOption("PayPal")}
						/>
						{integratedWalletType === "apple" && (
							<PaymentOption
								icons={[<Image src="/img/store/apple-pay.svg" width={26} height={20} />]}
								selected={selectedPaymentOption === "ApplePay"}
								select={() => setSelectedPaymentOption("ApplePay")}
							/>
						)}
						{integratedWalletType === "google" && (
							<PaymentOption
								icons={[<Image src="/img/store/google-pay.svg" width={26} height={20} />]}
								selected={selectedPaymentOption === "GooglePay"}
								select={() => setSelectedPaymentOption("GooglePay")}
							/>
						)}
					</div>
					{selectedPaymentOption === "Card" && (defaultPaymentMethod || savedPaymentMethods) && (
						<PaymentMethods
							savedPaymentMethods={savedPaymentMethods}
							defaultPaymentMethod={defaultPaymentMethod}
							select={setSelectedPaymentMethod}
							selected={selectedPaymentMethod}
						/>
					)}
				</div>
				{selectedPaymentOption === "Card" && (
					<>
						<h3 className="mt-7 font-montserrat text-base font-bold text-neutral-700 dark:text-white">
							{!defaultPaymentMethod || !savedPaymentMethods
								? "Enter other card details"
								: "Enter card details"}
						</h3>
						<div className="flex items-center justify-start overflow-hidden">
							<div>
								<Input
									width="large"
									type="text"
									label="Name on card"
									defaultValue={nameOnCard}
									disabled={processingPayment}
									onChange={(e: any) => setNameOnCard(e.target.value)}
									placeholder="John doe"
								/>
								<div className="mt-2 flex flex-col justify-start phone:flex-row phone:items-center">
									<div className="mr-0 w-48 phone:mr-7">
										<label className="text-neutral-600 dark:text-neutral-300">Card number</label>
										<CardNumberElement
											onChange={(data) => setCardNumberInput(data)}
											options={{
												disabled: processingPayment,
												placeholder: "4024 0071 1411 4951",
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
													base: clsx("w-[200px]", StripeInputBaseStyles),
													focus: "border-[#199532] outline-none",
													invalid: "border-[#F84A4A]",
												},
											}}
										/>
									</div>
									<div className="mt-2 flex items-center justify-start phone:mt-0">
										<div className="mr-5 w-max">
											<label className="text-neutral-600 dark:text-neutral-300">Expiry</label>
											<div className="w-20">
												<CardExpiryElement
													onChange={(data) => setCardExpiryInput(data)}
													options={{
														disabled: processingPayment,
														placeholder: "04 / 25",
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
															base: StripeInputBaseStyles,
															focus: "border-[#199532]",
															invalid: "border-[#F84A4A]",
														},
													}}
												/>
											</div>
										</div>
										<div className="w-max">
											<label className="text-neutral-600 dark:text-neutral-300">CVC</label>
											<div className="w-14">
												<CardCvcElement
													onChange={(data) => setCardCvcInput(data)}
													options={{
														disabled: processingPayment,
														placeholder: "964",
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
															base: StripeInputBaseStyles,
															focus: "border-[#199532]",
															invalid: "border-[#F84A4A]",
														},
													}}
												/>
											</div>
										</div>
									</div>
								</div>
								<Checkbox
									className="!mt-4"
									state={saveCardAsDefault}
									callback={() => setSaveCardAsDefault(!saveCardAsDefault)}
								>
									{defaultPaymentMethod === null
										? "Save payment method to use it again easily in the future."
										: "Save payment method as default for future purchases."}
								</Checkbox>
							</div>
						</div>
					</>
				)}
				<div className="mt-9 flex flex-col items-start justify-items-start lg:flex-row">
					{(appliedDiscount || thresholdDiscount) && (
						<div className="mr-9 h-[224px] w-full lg:w-96">
							<h3 className="font-montserrat text-base font-bold text-neutral-700 dark:text-white">
								Applied discounts
							</h3>
							<div className="flex h-full flex-col justify-between">
								<div className="text-black dark:text-white">
									<div className="mb-2">
										{appliedDiscountCode.length > 1 && (
											<div className="flex justify-between">
												<h3 className="flex items-center justify-start text-base font-semibold text-neutral-300">
													Code:{" "}
													<code className="ml-2 text-lg text-[#0FA958] drop-shadow-[0px_0px_4px_#0FA95898]">
														{appliedDiscountCode}
													</code>
												</h3>
											</div>
										)}
										<div className="max-h-[8rem]">
											<ul className="pl-3">
												{discountedItems.length >= 1 &&
													cart.length >= 1 &&
													discountedItems.map((item) => (
														<li className="flex list-decimal justify-between text-sm">
															<p className="dark:text-neutral-400">
																• {cart.filter((_item) => _item.id === item.id)[0].name}
															</p>
															<p className="text-[#0FA958] drop-shadow-[0px_0px_4px_#0FA95898]">
																-$
																{item.savings.toFixed(2)}
															</p>
														</li>
													))}
												{thresholdDiscount && (
													<li className="flex list-decimal justify-between text-sm">
														<p className="flex items-center justify-center space-x-1 dark:text-neutral-400">
															<span>• Threshold discount</span>
															<Tooltip content="10% Discount applied because base cart value exceeds $20">
																<Iconify icon="ant-design:question-circle-filled" />
															</Tooltip>
														</p>
														<p className="text-[#0FA958] drop-shadow-[0px_0px_4px_#0FA95898]">
															-$
															{(
																(parseFloat(subtotalCost) - appliedSavings) *
																0.1
															).toFixed(2)}
														</p>
													</li>
												)}
											</ul>
										</div>
									</div>
								</div>
								<div className="flex w-full justify-between rounded-lg bg-neutral-300 px-4 py-3 dark:bg-dank-500">
									<Title size="small">Total:</Title>
									<Title size="small">${totalCost}</Title>
								</div>
							</div>
						</div>
					)}
					<AccountInformation
						stripe={stripe}
						userId={userId}
						cartData={cart}
						clientSecret={_clientSecret.current}
						invoiceId={invoiceId}
						acceptsIntegratedWallet={acceptsIntegratedWallet}
						integratedWallet={integratedWallet}
						selectedPaymentOption={selectedPaymentOption}
						userEmail={receiptEmail}
						onEmailChange={setReceiptEmail}
						processingPayment={processingPayment}
						confirmPayment={confirmPayment}
						completedPayment={completedPayment}
						canCheckout={canCheckout}
						itemsTotal={itemsTotal}
						subtotalCost={subtotalCost}
						totalCost={totalCost}
						gift={gift}
						discounts={{
							discountsUsed: [
								{
									code: appliedDiscountCode ?? "",
									items: appliedDiscountCode.length >= 1 ? discountedItems.map((di) => di.id) : [],
								},
								{
									code: thresholdDiscount ? "THRESHOLD" : "",
									items: thresholdDiscount ? cart.map((item) => item.id) : [],
								},
							],
							discountedItemsTotalSavings: discountedItems.reduce(
								(acc: number, item: DiscountItem) => acc + item.savings,
								0
							),
							thresholdDiscount: thresholdDiscount
								? (
										(parseFloat(subtotalCost) -
											discountedItems.reduce(
												(acc: number, item: DiscountItem) => acc + item.savings,
												0
											)) *
										0.1
								  ).toFixed(2)
								: "0.00",
						}}
						integratedWalletButtonType={
							getSelectedPriceValue(cart[0], cart[0].selectedPrice).interval ? "subscribe" : "check-out"
						}
					/>
				</div>
			</div>
		</div>
	);
}
