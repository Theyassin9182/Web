import axios from "axios";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { useEffect, useMemo, useRef, useState } from "react";
import { Title } from "src/components/Title";
import Container from "src/components/ui/Container";
import { PageProps, UserAge, UserData } from "src/types";
import { withSession } from "src/util/session";
import { CartItem as CartItems, Metadata, ProductType } from ".";
import CartItem from "src/components/store/cart/CartItem";
import MarketingBox, { MarketBoxVariants } from "src/components/store/cart/MarketingBox";
import Button from "src/components/ui/Button";
import OtherProduct from "src/components/store/cart/OtherProduct";
import { useRouter } from "next/router";
import Input from "src/components/store/Input";
import { DiscountItem } from "./checkout";
import clsx from "clsx";
import StoreBreadcrumb from "src/components/store/StoreBreadcrumb";
import { Session } from "next-iron-session";
import Tooltip from "src/components/ui/Tooltip";
import { Icon as Iconify } from "@iconify/react";
import { toast } from "react-toastify";
import { AppliedDiscount } from "../api/store/discount/apply";
import { dbConnect } from "src/util/mongodb";
import { PurchaseRecord } from "../api/store/checkout/finalize/paypal";
import { stripeConnect } from "src/util/stripe";
import { getSelectedPriceValue } from "src/util/store";
import { STORE_BLOCKED_COUNTRIES, STORE_CUSTOM_MIN_AGE, STORE_NO_MIN_AGE } from "src/constants";
import AgeVerification from "src/components/store/modals/AgeVerification";
import Dialog from "src/components/Dialog";

interface Props extends PageProps {
	cartData: CartItems[];
	upsells: UpsellProduct[];
	country: keyof typeof STORE_CUSTOM_MIN_AGE | (string & {});
	verification: Omit<UserAge, "verifiedOn">;
}

export interface UpsellProduct {
	id: string;
	name: string;
	image: string;
	type: ProductType;
	category?: string;
	prices: {
		id: string;
		value: number;
	}[];
}

export default function Cart({ cartData, upsells, country, user, verification }: Props) {
	const router = useRouter();

	const marketingBoxView = useRef<MarketBoxVariants>(Math.random() >= 0.5 ? "gifting" : "perks");

	const [processingChange, setProcessingChange] = useState<boolean>(false);
	const [cart, setCart] = useState<CartItems[]>(cartData);
	const [salesTax, setSalesTax] = useState<number>(0);
	const [subtotalCost, setSubtotalCost] = useState<number>(0);
	const [totalCost, setTotalCost] = useState<number>(0);

	const [isGift, setIsGift] = useState(false);
	const [giftRecipient, setGiftRecipient] = useState("");
	const [validGiftRecipient, setValidGiftRecipient] = useState(false);

	const [discountData, setDiscountData] = useState<AppliedDiscount | null>(null);

	const [thresholdDiscount, setThresholdDiscount] = useState<Boolean>();
	const [discountError, setDiscountError] = useState("");
	const [discountInput, setDiscountInput] = useState("");
	const [discountedItems, setDiscountedItems] = useState<DiscountItem[]>([]);
	const [appliedCode, setAppliedCode] = useState("");
	const [appliedSavings, setAppliedSavings] = useState(0);
	const [appliedDiscount, setAppliedDiscount] = useState(false);

	const [userCountry, setUserCountry] = useState(country);
	const [openDialog, setOpenDialog] = useState(false);
	const [requiresAgeVerification, setRequiresAgeVerification] = useState(
		!(
			Object.keys(STORE_NO_MIN_AGE).concat(Object.keys(STORE_BLOCKED_COUNTRIES)).includes(country) &&
			!verification.verified
		) && verification.years < (STORE_CUSTOM_MIN_AGE[userCountry as keyof typeof STORE_CUSTOM_MIN_AGE] ?? 18)
	);

	useEffect(() => {
		const cartTotal = cart.reduce(
			(acc: number, item: CartItems) =>
				acc + (getSelectedPriceValue(item, item.selectedPrice).value / 100) * item.quantity,
			0
		);

		setSubtotalCost(cartTotal);
	}, []);

	useEffect(() => {
		try {
			axios({
				url: "/api/store/cart/set",
				method: "PUT",
				data: { cartData: cart },
			}).then(() => {
				const cartTotal = cart.reduce(
					(acc: number, item: CartItems) =>
						acc + (getSelectedPriceValue(item, item.selectedPrice).value / 100) * item.quantity,
					0
				);
				setSubtotalCost(cartTotal);

				if (discountInput.length >= 1) {
					recalculateDiscount();
				} else {
					setAppliedDiscount(appliedDiscount ?? cartTotal >= 20);
					axios("/api/store/discount/get")
						.then(({ data }) => {
							setAppliedDiscount(true);
							setDiscountData(data);
						})
						.catch(() => {
							const rawSalesTax = cartTotal * 0.0675;

							setThresholdDiscount(cartTotal >= 20 && cart[0].type !== "subscription");
							setSalesTax(rawSalesTax);
							setTotalCost(cartTotal + rawSalesTax);
						});
				}
			});
		} catch (e: any) {
			if (e.response.status === 429) {
				toast.error("You are doing that too fast! Input a number instead of incrementing it.", {
					theme: "colored",
					position: "top-center",
				});
			}
		}
	}, [cart]);

	useEffect(() => {
		if (discountError.length > 1) return setDiscountError("");
	}, [discountInput]);

	// If the country prop is unknown, re-attempt to retrieve it via Cloudflare Quic.
	useEffect(() => {
		if (country === "??") {
			(async () => {
				let { data } = await axios("https://cloudflare-quic.com/b/headers");
				const country = data.headers["Cf-Ipcountry"];
				setRequiresAgeVerification(
					!(
						Object.keys(STORE_NO_MIN_AGE).concat(Object.keys(STORE_BLOCKED_COUNTRIES)).includes(country) &&
						!verification.verified
					) &&
						verification.years <
							(STORE_CUSTOM_MIN_AGE[userCountry as keyof typeof STORE_CUSTOM_MIN_AGE] ?? 18)
				);
				setUserCountry(data.headers["Cf-Ipcountry"]);
			})();
		}
	}, [country]);

	const deleteItem = (index: number) => {
		if (!processingChange) {
			const newCart = [...cart];
			newCart.splice(index, 1);
			setCart(newCart);
			if (newCart.length < 1) {
				router.push("/store");
			}
		}
	};

	const updateQuantity = (index: number, quantity: number) => {
		if (!processingChange) {
			const newCart = [...cart];
			newCart[index].quantity = quantity;
			setCart(newCart);
		}
	};

	const changeInterval = (index: number, interval: "month" | "year") => {
		if (!processingChange) {
			const newCart: CartItems[] = [...cart];
			newCart[index].selectedPrice = newCart[index].prices.filter(
				(price) => price.interval?.period === interval
			)[0].id;
			setCart(newCart);
		}
	};

	const removeDiscount = () => {
		axios(`/api/store/discount/remove`)
			.then(() => {
				setAppliedCode("");
				setAppliedSavings(0);
				setDiscountInput("");
				setDiscountedItems([]);
				setAppliedDiscount(false);
			})
			.catch(() => {
				setDiscountError("No discount is currently active");
				setTimeout(() => {
					setDiscountError("");
				}, 3_000);
			});
	};

	const submitDiscountCode = () => {
		if (discountInput.length < 1) return;
		if (discountError.length > 1) return setDiscountError("");

		setProcessingChange(true);
		axios(`/api/store/discount/apply?code=${discountInput}`)
			.then(({ data }) => {
				setAppliedDiscount(true);
				setDiscountData(data);
			})
			.catch((e) => {
				setAppliedCode("");
				switch (e.response.status) {
					case 403:
						setDiscountError("Minimum cart value not met.");
						break;
					case 404:
						setDiscountError("Invalid discount code provided.");
						break;
					case 406:
						setDiscountError("Could not apply to any cart items.");
						break;
					case 410:
						setDiscountError("Discount code has expired.");
						break;
				}
			})
			.finally(() => setProcessingChange(false));
	};

	const recalculateDiscount = () => {
		if (appliedCode.length < 1) {
			return;
		}

		setProcessingChange(true);
		axios({
			method: "POST",
			url: `/api/store/discount/recalculate`,
			data: { code: appliedCode, cart },
		})
			.then(({ data }) => {
				setAppliedDiscount(true);
				setDiscountData(data);
			})
			.catch((e) => {
				setAppliedCode("");
				console.error(e);
			})
			.finally(() => setProcessingChange(false));
	};

	useMemo(() => {
		const data = discountData;
		if (!data) {
			return;
		}
		const _salesTax = subtotalCost * 0.0675;
		const total = subtotalCost + _salesTax - data.totalSavings;

		setAppliedCode(data.code);
		setDiscountInput(data.code);
		setDiscountedItems(data.discountedItems);
		setAppliedSavings(data.totalSavings ?? 0);
		setSalesTax(_salesTax);
		setTotalCost(total);
		setThresholdDiscount(total >= 20 && cart[0].type !== "subscription");
	}, [discountData, subtotalCost]);

	const addToCart = async (item: CartItems) => {
		let toastMessage: string | undefined;
		const typeToAdd = item.type;
		const cartHasSubscription = cart.filter((i) => i.type === "subscription").length >= 1;
		const cartHasSingle = cart.filter((i) => i.type === "single").length >= 1;

		if (
			typeToAdd === "single" &&
			item.category === "lootbox" &&
			!verification.verified &&
			!requiresAgeVerification
		) {
			setOpenDialog(true);
		}

		if (typeToAdd === "subscription" && cartHasSubscription) {
			toastMessage = "Only one subscription should be added your cart at a time.";
		} else if (typeToAdd === "subscription" && cartHasSingle) {
			toastMessage = "You cannot combine subscription and single-purchase products.";
		} else if (typeToAdd == "single" && cartHasSubscription) {
			toastMessage = "You cannot combine subscription and single-purchase products.";
		}

		if (toastMessage) {
			return toast.info(toastMessage, {
				position: "top-center",
				theme: "colored",
				hideProgressBar: true,
				autoClose: 3000,
			});
		}

		const alreadyExists = cart.findIndex((i) => i.id === item.id);
		if (alreadyExists !== -1) {
			let _cart = cart.slice();
			_cart[alreadyExists].quantity += 1;
			setCart(_cart);
		} else {
			setCart((i) => [...i, item]);
		}
	};

	const addUpsellProduct = async (id: string) => {
		try {
			const { data: formatted }: { data: CartItems } = await axios(
				`/api/store/product/find?id=${id}&action=format&to=cart-item`
			);
			if (requiresAgeVerification && formatted.category?.toLowerCase() === "lootbox") {
				return setOpenDialog(true);
			}
			addToCart(formatted);
		} catch (e) {
			toast.error("We were unable to update your cart information. Please try again later.");
		}
	};

	useEffect(() => {
		setValidGiftRecipient(
			/^[0-9]*$/.test(giftRecipient) &&
				giftRecipient.length >= 16 &&
				giftRecipient.length <= 20 &&
				giftRecipient !== user!.id
		);
	}, [giftRecipient]);

	const goToCheckout = () => {
		axios({
			url: "/api/store/config/set",
			method: "POST",
			data: {
				isGift,
				giftFor: giftRecipient,
			},
		})
			.then(() => {
				return router.push("/store/checkout");
			})
			.catch((e) => {
				console.error(e);
			});
	};

	return (
		<Container title="Shopping Cart" user={user}>
			<div className="mt-12 mb-5 flex flex-col items-center justify-between space-y-2 sm:flex-row sm:space-y-0">
				<Title size="big">Shopping cart</Title>
			</div>
			<StoreBreadcrumb currentPage="cart" />
			<Dialog open={openDialog} onClose={setOpenDialog}>
				<AgeVerification age={verification.years} country={userCountry} />
			</Dialog>
			<div className="flex flex-col justify-between lg:flex-row lg:space-x-5 xl:space-x-0">
				<div className="flex w-full flex-col lg:w-[73%]">
					<div className="h-max w-full rounded-lg bg-light-500 px-4 py-3 dark:bg-dark-200">
						<Title size="small">Your items</Title>
						<div className="mt-2">
							{cart.map((item, i) => (
								<CartItem
									size="large"
									index={i}
									{...item}
									updateQuantity={updateQuantity}
									changeInterval={changeInterval}
									deleteItem={deleteItem}
									disabled={processingChange}
								/>
							))}
						</div>
					</div>
					<div className="mt-5 h-max w-full rounded-lg bg-light-500 px-4 py-3 dark:bg-dark-200">
						<Title size="small">Other users have also bought</Title>
						<div className="mt-2">
							{upsells.map((upsell) => (
								<OtherProduct {...upsell} addToCart={addUpsellProduct} />
							))}
						</div>
					</div>
				</div>
				<div className="my-10 flex w-full flex-col items-center space-y-10 md:flex-row-reverse md:items-start md:space-y-0 lg:my-0 lg:mb-10 lg:w-80 lg:flex-col lg:space-y-5">
					{cart[0] && cart[0].type === "subscription" ? (
						<MarketingBox variant="subscriptionSavings" />
					) : (
						<MarketingBox variant={marketingBoxView.current} />
					)}
					<div className="h-max w-full rounded-lg bg-light-500 px-8 py-7 dark:bg-dark-200 md:mr-10 lg:my-5 lg:mr-10">
						<Title size="small">Details</Title>
						<p className="mt-2 font-inter text-sm leading-tight text-neutral-700/80 dark:text-light-600">
							Checkout is completed in USD, bank or card fees may apply to international payments. The
							total below is what is required to be paid upon checkout.
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
												!isGift
													? "bg-dank-300 text-white"
													: "bg-black/10 text-neutral-600 dark:bg-black/30 dark:text-neutral-400",
												"rounded-l-md border-[1px] border-transparent px-3 py-1"
											)}
											onClick={() => setIsGift(false)}
										>
											Myself
										</p>
										<p
											className={clsx(
												isGift
													? "bg-dank-300 text-white"
													: "bg-black/10 text-neutral-600 dark:bg-black/30 dark:text-neutral-400",
												"rounded-r-md border-[1px] border-transparent px-3 py-1"
											)}
											onClick={() => setIsGift(true)}
										>
											Someone else
										</p>
									</div>
									{isGift && (
										<div className="mt-2">
											<Input
												width="w-[190px]"
												type="text"
												placeholder="270904126974590976"
												className={clsx(
													"!py-1 dark:placeholder:text-neutral-500",
													validGiftRecipient ? "" : "border-red-500"
												)}
												onChange={(e: any) => setGiftRecipient(e.target.value)}
											/>
										</div>
									)}
								</div>
							</div>
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
														discountInput?.length < 1 || processingChange
															? "!bg-[#7F847F] text-[#333533]"
															: "",
														appliedDiscount && appliedCode === discountInput && "bg-red-500"
													)}
													onClick={appliedDiscount ? removeDiscount : submitDiscountCode}
													disabled={processingChange}
												>
													{appliedDiscount && appliedCode === discountInput
														? "Clear"
														: "Submit"}
												</Button>
											</div>
											{discountError.length > 1 && (
												<p className="text-right text-sm text-red-500">{discountError}</p>
											)}
										</div>
										{(appliedDiscount || thresholdDiscount) && (
											<div>
												<div className="flex items-center justify-between">
													<h3 className="font-montserrat text-base font-bold">Discount</h3>
													{processingChange ? (
														<div className="h-5 w-12 animate-[pulse_0.5s_ease-in-out_infinite] rounded bg-dank-400"></div>
													) : (
														<h3 className="font-montserrat text-base font-bold text-[#0FA958] drop-shadow-[0px_0px_4px_#0FA95898]">
															-$
															{(
																appliedSavings +
																(thresholdDiscount ? totalCost * 0.1 : 0)
															).toFixed(2)}
														</h3>
													)}
												</div>
												<div>
													<ul className="pl-3">
														{discountedItems?.map((item) => {
															const cartItem = cart.filter(
																(_item) => _item.id === item.id
															)[0];
															return (
																<li className="flex list-decimal justify-between text-sm">
																	<p className="dark:text-[#b4b4b4]">
																		• {cartItem.quantity}x {cartItem.name}
																	</p>
																	<p className="text-[#0FA958] drop-shadow-[0px_0px_4px_#0FA95898]">
																		-$
																		{item.savings.toFixed(2)}
																	</p>
																</li>
															);
														})}
														{thresholdDiscount && (
															<li className="flex list-decimal items-center justify-between text-sm">
																<p className="flex items-center justify-center space-x-1 dark:text-[#b4b4b4]">
																	<span>• Threshold discount</span>
																	<Tooltip content="10% Discount applied because base cart value exceeds $20">
																		<Iconify icon="ant-design:question-circle-filled" />
																	</Tooltip>
																</p>
																{processingChange ? (
																	<div className="h-4 w-12 animate-[pulse_0.5s_ease-in-out_infinite] rounded bg-dank-400"></div>
																) : (
																	<p className="text-[#0FA958] drop-shadow-[0px_0px_4px_#0FA95898]">
																		-$
																		{(totalCost * 0.1).toFixed(2)}
																	</p>
																)}
															</li>
														)}
													</ul>
												</div>
											</div>
										)}
									</div>
								</div>
							</div>
						</div>
						<div className="mt-3">
							<p className="text-right text-sm text-neutral-600 dark:text-neutral-300/50">
								Added sales tax: ${salesTax.toFixed(2)}
							</p>
							<div className="flex w-full items-center justify-between rounded-lg bg-neutral-300 px-4 py-3 dark:bg-dank-500">
								<Title size="small">Total:</Title>
								{processingChange ? (
									<div className="h-5 w-16 animate-[pulse_0.5s_ease-in-out_infinite] rounded bg-dank-400"></div>
								) : (
									<Title size="small">
										${(totalCost - (thresholdDiscount ? totalCost * 0.1 : 0)).toFixed(2)}
									</Title>
								)}
							</div>
						</div>

						<Button
							size="medium"
							className={clsx("mt-3 w-full", processingChange ? "bg-[#7F847F] text-[#333533]" : "")}
							onClick={goToCheckout}
							disabled={processingChange}
						>
							Continue to Checkout
						</Button>
					</div>
				</div>
			</div>
		</Container>
	);
}

export const getServerSideProps: GetServerSideProps = withSession(
	async (ctx: GetServerSidePropsContext & { req: { session: Session } }) => {
		const user = await ctx.req.session.get("user");

		if (!user) {
			return {
				redirect: {
					destination: `/api/auth/login?redirect=${encodeURIComponent(ctx.resolvedUrl)}`,
					permanent: false,
				},
			};
		}

		const cart = await ctx.req.session.get("cart");
		if (!cart)
			return {
				redirect: {
					destination: `/store`,
					permanent: false,
				},
			};

		const db = await dbConnect();
		const dbUser = (await db.collection("users").findOne({ _id: user.id })) as UserData;
		// Check request headers for cloudflare country header
		let country = ctx.req.headers["cf-ipcountry"] ?? "??";

		const stripe = stripeConnect();
		const samplePurchaseSet = (await db
			.collection("purchases")
			.find()
			.sort({ purchaseTime: -1 })
			.limit(100)
			.toArray()) as PurchaseRecord[];
		const itemCounts: { [key: string]: number } = {};
		for (let purchase of samplePurchaseSet) {
			for (let item of purchase.items) {
				itemCounts[item.id!] = (itemCounts[item.id!] ?? 0) + item.quantity;
			}
		}

		const sortedSample = Object.fromEntries(Object.entries(itemCounts).sort(([_, a], [__, b]) => b - a));
		const top3 = Object.keys(sortedSample).slice(0, 3);
		const remainder = Object.keys(sortedSample).slice(3);
		const twoRandom = [...remainder].sort(() => 0.5 - Math.random()).slice(0, 2);
		const upsellsRaw = [...top3, ...twoRandom].sort(() => 0.5 - Math.random());
		const upsells: UpsellProduct[] = [];

		for (let upsellProduct of upsellsRaw) {
			const product = await stripe.products.retrieve(upsellProduct);
			const prices = (
				await stripe.prices.list({
					product: product.id,
					active: true,
				})
			).data.sort((a, b) => a.unit_amount! - b.unit_amount!);

			upsells.push({
				id: product.id,
				image: product.images[0],
				name: product.name,
				type: (product.metadata as Metadata).type!,
				...((product.metadata as Metadata).category && { category: (product.metadata as Metadata).category }),
				prices: prices.map((price) => ({
					id: price.id,
					value: price.unit_amount!,
				})),
			});
		}

		return {
			props: {
				cartData: cart,
				upsells,
				user,
				country,
				verification: {
					verified: dbUser.ageVerification?.verified ?? false,
					years: dbUser.ageVerification?.years ?? 0,
				},
			},
		};
	}
);
