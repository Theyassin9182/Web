import axios from "axios";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { useContext, useEffect, useRef, useState } from "react";
import { Title } from "src/components/Title";
import Container from "src/components/ui/Container";
import { PageProps, UserAge, UserData } from "src/types";
import { withSession } from "src/util/session";
import { CartItem as ICartItem, Metadata, ProductType } from ".";
import CartItem from "src/components/store/cart/CartItem";
import MarketingBox, { MarketBoxVariants } from "src/components/store/cart/MarketingBox";
import OtherProduct from "src/components/store/cart/OtherProduct";
import { useRouter } from "next/router";
import StoreBreadcrumb from "src/components/store/StoreBreadcrumb";
import { Session } from "next-iron-session";
import Tooltip from "src/components/ui/Tooltip";
import { Icon as Iconify } from "@iconify/react";
import { toast } from "react-toastify";
import { dbConnect } from "src/util/mongodb";
import { PurchaseRecord } from "../api/store/checkout/finalize/paypal";
import { stripeConnect } from "src/util/stripe";
import { getSelectedPriceValue } from "src/util/store";
import {
	STORE_BLOCKED_COUNTRIES,
	STORE_CUSTOM_MIN_AGE,
	STORE_FLAT_DISCOUNT_PERCENTAGE,
	STORE_MINIMUM_DISCOUNT_VALUE,
	STORE_NO_MIN_AGE,
	STORE_TAX_PERCENT,
	TIME,
} from "src/constants";
import AgeVerification from "src/components/store/modals/AgeVerification";
import Dialog from "src/components/Dialog";
import SubscriptionInfo from "src/components/store/cart/SubscriptionInfo";
import { format } from "date-fns";
import { useCart } from "src/util/hooks/useCart";
import { useDiscount } from "src/util/hooks/useDiscount";
import CartDetails from "src/components/store/cart/Details";
import StoreProvider, { StoreContext } from "src/contexts/StoreProvider";

interface Props extends PageProps {
	cartData: ICartItem[];
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

export default function Cart({ upsells, country, user, verification }: Props) {
	const router = useRouter();

	const { discount } = useDiscount();
	const { cart, mutate, isValidating } = useCart();
	const context = useContext(StoreContext);

	const marketingBoxView = useRef<MarketBoxVariants>(Math.random() >= 0.5 ? "gifting" : "perks");

	const [itemsShaking, setItemsShaking] = useState<string[]>([]);

	const [userCountry, setUserCountry] = useState(country);
	const [openDialog, setOpenDialog] = useState(false);
	const [requiresAgeVerification, setRequiresAgeVerification] = useState(
		!(
			Object.keys(STORE_NO_MIN_AGE).concat(Object.keys(STORE_BLOCKED_COUNTRIES)).includes(country) &&
			!verification.verified
		) && verification.years < (STORE_CUSTOM_MIN_AGE[userCountry as keyof typeof STORE_CUSTOM_MIN_AGE] ?? 18)
	);

	const subtotal =
		!isValidating && cart.length >= 1
			? cart.reduce(
					(acc: number, item: ICartItem) =>
						acc + ((getSelectedPriceValue(item, item.selectedPrice)?.value ?? 100) / 100) * item.quantity,
					0
			  )
			: 0;
	const salesTax = subtotal * (STORE_TAX_PERCENT / 100);
	const total = subtotal + salesTax - discount.totalSavings;
	const meetsThreshold = total >= STORE_MINIMUM_DISCOUNT_VALUE && cart[0].type !== "subscription";

	useEffect(() => {
		if (cart.length < 1 && !isValidating) router.push("/store");
	}, [cart, isValidating]);

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

	const addUpsellProduct = async (id: string) => {
		if (cart.find((i) => i.id === id) && cart.find((i) => i.id === id)!.quantity + 1 > 100) {
			setItemsShaking((curr) => [...curr, id]);
			return setTimeout(() => {
				setItemsShaking((curr) => curr.filter((i) => i !== id));
			}, 820);
		}
		try {
			const { data: formatted }: { data: ICartItem } = await axios(
				`/api/store/product/find?id=${id}&action=format&to=cart-item`
			);
			if (requiresAgeVerification && formatted.category?.toLowerCase() === "lootbox") {
				return setOpenDialog(true);
			}
			await mutate.addItem(formatted, true);
		} catch (e) {
			toast.error("We were unable to update your cart information. Please try again later.");
		}
	};

	const price = () => getSelectedPriceValue(cart[0], cart[0].selectedPrice);

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
					{cart[0] ? (
						cart[0].type !== "subscription" ? (
							<>
								<div className="h-max w-full rounded-lg bg-light-500 px-4 py-3 dark:bg-dark-200">
									<Title size="small">Your items</Title>
									<div className="mt-2">
										{cart.map((item, i) => (
											<CartItem
												key={item.id}
												index={i}
												{...item}
												changeInterval={mutate.changeInterval}
												setQuantity={mutate.setQty}
												increaseQuantity={mutate.incrQty}
												decreaseQuantity={mutate.decrQty}
												deleteItem={mutate.delItem}
												disabled={false}
												shouldShake={itemsShaking.includes(item.id)}
											/>
										))}
									</div>
								</div>
								<div className="mt-5 h-max w-full rounded-lg bg-light-500 px-4 py-3 dark:bg-dark-200">
									<Title size="small">Other users have also bought</Title>
									<div className="mt-2">
										{upsells.map((upsell) => (
											<OtherProduct key={upsell.id} {...upsell} addToCart={addUpsellProduct} />
										))}
									</div>
								</div>
							</>
						) : (
							<>
								<div className="mb-10 h-max w-full rounded-lg bg-light-500 px-4 py-3 dark:bg-dark-200">
									<Title size="small">Your items</Title>
									<div className="mt-2">
										{cart.map((item, i) => (
											<CartItem
												key={item.id}
												index={i}
												{...item}
												changeInterval={mutate.changeInterval}
												setQuantity={mutate.setQty}
												increaseQuantity={mutate.incrQty}
												decreaseQuantity={mutate.decrQty}
												deleteItem={mutate.delItem}
												disabled={false}
												shouldShake={itemsShaking.includes(item.id)}
											/>
										))}
									</div>
									<div className="my-5 flex w-full items-center justify-start space-x-5 rounded-lg bg-dank-200 py-3 px-5">
										<p>
											<Iconify icon="ant-design:info-circle-outlined" width={24} />
										</p>
										{context?.config?.isGift ? (
											<p className="max-w-[90%] text-sm">
												The selected subscription is being purchased as a gift. Gifted
												subscriptions are not recurring products, therefore you will not be
												charged again for this purchase.
											</p>
										) : (
											<p className="max-w-[90%] text-sm">
												The selected subscription will last {price().interval?.count}{" "}
												{price().interval!.period + (price().interval!.count > 1 ? "s " : " ")}
												and is automatically assigned to{" "}
												<Tooltip content={user!.username + "#" + user!.discriminator}>
													<span className="underline">your Discord account</span>
												</Tooltip>
												. You will be charged the same amount again $
												{(
													total -
													(meetsThreshold
														? total * (STORE_FLAT_DISCOUNT_PERCENTAGE / 100)
														: 0)
												).toFixed(2)}{" "}
												on{" "}
												{format(
													new Date(
														new Date().getTime() +
															TIME[price().interval?.period as keyof typeof TIME]
													),
													"LLLL do, yyyy 'at' h:mm aaa"
												)}
											</p>
										)}
									</div>
									<SubscriptionInfo productId={cart[0].id} />
								</div>
							</>
						)
					) : (
						<></>
					)}
				</div>
				<div className="my-10 flex w-full flex-col items-center space-y-10 md:flex-row-reverse md:items-start md:space-y-0 lg:my-0 lg:mb-10 lg:w-80 lg:flex-col lg:space-y-5">
					{cart[0] && cart[0].type === "subscription" ? (
						<MarketingBox variant="subscriptionSavings" />
					) : (
						<MarketingBox variant={marketingBoxView.current} />
					)}
					<CartDetails
						userId={user!.id}
						acceptDiscounts={!isValidating && cart[0] && cart[0].type !== "subscription"}
					/>
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
		if (!cart || cart.length < 1)
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
				if (item.type === "recurring") break;
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
