import axios from "axios";
import { useEffect, useState } from "react";
import { Title } from "src/components/Title";
import Container from "src/components/ui/Container";
import { PageProps, User, UserAge, UserData } from "src/types";
import clsx from "clsx";
import { GetServerSideProps, GetServerSidePropsContext, GetStaticProps } from "next";
import { withSession } from "src/util/session";
import Modal from "src/components/store/Modal";
import ShoppingCart from "src/components/store/ShoppingCart";
import { toast } from "react-toastify";
import PagedBanner, { BannerPage } from "src/components/store/PagedBanner";
import { UpsellProduct } from "./cart";
import PopularProduct from "src/components/store/PopularProduct";
import Product from "src/components/store/Product";
import { DetailedPrice, ProductDetails } from "../api/store/product/details";
import LoadingProduct from "src/components/store/LoadingProduct";
import { Session } from "next-iron-session";
import { dbConnect } from "src/util/mongodb";
import BannedUser from "src/components/store/BannedUser";
import Dialog from "src/components/Dialog";
import AgeVerification from "src/components/store/modals/AgeVerification";
import { STORE_BLOCKED_COUNTRIES, STORE_CUSTOM_MIN_AGE, STORE_NO_MIN_AGE } from "src/constants";
import { fetcher, useCart } from "src/util/hooks/useCart";
import useSWR from "swr";

interface PossibleMetadata {
	type: ProductType;
	category: string;
	hidden: "true" | "false";
	isGift: string;
	paypalPlan: string;
	giftProduct: string;
	mainProduct: string;
	mainInterval: string;
	ignoreWebhook: "true" | "false";
}

export type ProductType = "single" | "subscription" | "giftable";
export type Metadata = Partial<PossibleMetadata>;

export type CartItem = {
	id: string;
	name: string;
	type: ProductType;
	category?: string;
	image: string;
	selectedPrice: string;
	prices: DetailedPrice[];
	quantity: number;
};

export type ListedProduct = Omit<ProductDetails, "body"> & { hidden: boolean; created: number };
export type ListedProductRaw<T extends unknown> = Omit<ListedProduct, "prices"> & {
	prices: {
		[k: string]: T;
	};
};

export type ModalProps = {
	product: ListedProduct;
	annualPricing?: Boolean;
	addToCart: any;
	closeModal: any;
	titles: {
		included: string;
		additional?: string;
	};
	cta?: {
		text: string;
		callback: any;
	};
};

interface Props extends PageProps {
	banned: boolean;
	country: keyof typeof STORE_CUSTOM_MIN_AGE | (string & {});
	verification: Omit<UserAge, "verifiedOn">;
}

export default function StoreHome({ user, banned, country, verification }: Props) {
	const { mutate } = useCart();
	const { data: bannerPages, isValidating: areBannerPagesValidating } = useSWR<BannerPage[]>(
		banned ? null : "/api/store/banners/list?active=true",
		fetcher
	);
	const { data: popularProducts, isValidating: arePopsValidating } = useSWR<UpsellProduct[]>(
		banned ? null : "/api/store/products/popular",
		fetcher
	);
	const { data: subscriptions, isValidating: areSubsValidating } = useSWR<ListedProduct[]>(
		banned ? null : "/api/store/products/subscriptions/list",
		fetcher
	);
	const { data: products, isValidating: areProductsValidating } = useSWR<ListedProduct[]>(
		banned ? null : "/api/store/products/one-time/list",
		fetcher
	);

	const [userCountry, setUserCountry] = useState(country);
	const [modalProductId, setModalProductId] = useState("");
	const [openModal, setOpenModal] = useState(false);
	const [openDialog, setOpenDialog] = useState(false);

	const [cartButtonHovered, setCartButtonHovered] = useState(false);
	const [requiresAgeVerification, setRequiresAgeVerification] = useState(
		!(
			Object.keys(STORE_NO_MIN_AGE).concat(Object.keys(STORE_BLOCKED_COUNTRIES)).includes(country) &&
			!verification.verified
		) && verification.years < (STORE_CUSTOM_MIN_AGE[userCountry as keyof typeof STORE_CUSTOM_MIN_AGE] ?? 18)
	);

	const addProductById = async (id: string) => {
		try {
			const { data: product }: { data: CartItem } = await axios(
				`/api/store/product/find?id=${id}&action=format&to=cart-item`
			);
			if (requiresAgeVerification && product.category?.toLowerCase() === "lootbox") {
				return setOpenDialog(true);
			}
			await mutate.addItem(product);
		} catch (e) {
			toast.error("We were unable to update your cart information. Please try again later.");
		}
	};

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

	useEffect(() => {
		if (!openModal) {
			setModalProductId("");
		}
	}, [openModal]);

	useEffect(() => {
		if (modalProductId && modalProductId.length >= 1) {
			setOpenModal(true);
		} else {
			setOpenModal(false);
		}
	}, [modalProductId]);

	return (
		<>
			<Dialog open={openModal} onClose={setOpenModal} closeButton>
				<Modal productId={modalProductId} add={() => addProductById(modalProductId)} />
			</Dialog>
			{banned && <BannedUser />}
			{!banned && (
				<Container title="Store" user={user}>
					<Dialog open={openDialog} onClose={setOpenDialog}>
						<AgeVerification age={verification.years} country={userCountry} />
					</Dialog>
					<div className="mt-12 flex flex-col items-center justify-between space-y-2 sm:flex-row sm:space-y-0">
						<Title size="big">Store</Title>
						<ShoppingCart hovered={setCartButtonHovered} />
					</div>
					{areBannerPagesValidating ? (
						<div className={clsx(cartButtonHovered && "-z-10", "sticky mt-3 h-72 w-full max-w-7xl")}>
							<div className="h-72 w-full animate-pulse rounded-lg bg-neutral-300 dark:bg-dank-500"></div>
						</div>
					) : (
						bannerPages &&
						bannerPages.length >= 1 && (
							<div className={clsx(cartButtonHovered && "-z-10", "sticky mt-3 h-72 w-full max-w-7xl")}>
								<PagedBanner pages={bannerPages} height={"h-72"} />
							</div>
						)
					)}
					{arePopsValidating || areProductsValidating || areSubsValidating ? (
						<>
							<section className="mt-14">
								<Title size="medium" className="font-semibold">
									Popular products
								</Title>
								<div className="overflow-y-visible overflow-x-scroll xl:overflow-visible">
									<div className="mt-3 flex min-w-[1280px] justify-between space-x-10 xl:min-w-[unset]">
										{Array(3)
											.fill(0)
											.map((_, i) => (
												<LoadingProduct key={i} variant="popular" />
											))}
									</div>
								</div>
							</section>
							<section className="mt-4">
								<div className="mt-12 flex flex-col items-center justify-between space-y-2 sm:flex-row sm:space-y-0">
									<Title size="medium" className="font-semibold">
										Subscriptions
									</Title>
								</div>
								<div
									className="col-auto mt-4 grid place-items-center justify-center gap-x-8 gap-y-7 phone:justify-between"
									style={{
										gridTemplateColumns: "repeat(auto-fit, minmax(224px, auto))", // 224px is the width of the product card
									}}
								>
									{Array(5)
										.fill(0)
										.map((_, i) => (
											<LoadingProduct key={i} variant="normal" />
										))}
								</div>
							</section>
							<section className="mt-12 mb-12">
								<Title size="medium" className="text-center font-semibold phone:text-left">
									Items
								</Title>
								<div
									className={clsx("mt-4 grid gap-x-8 gap-y-7", "justify-start")}
									style={{
										gridTemplateColumns: "repeat(auto-fit, minmax(224px, auto))", // 224px is the width of the product card
									}}
								>
									{Array(5)
										.fill(0)
										.map((_, i) => (
											<LoadingProduct key={i} variant="normal" />
										))}
								</div>
							</section>
						</>
					) : (
						<>
							{popularProducts && popularProducts.length >= 1 && (
								<section className="mt-14">
									<Title size="medium" className="font-semibold">
										Popular products
									</Title>
									<div className="overflow-y-visible overflow-x-scroll xl:overflow-visible">
										<div className="mt-3 flex min-w-[1280px] justify-between space-x-10 xl:min-w-[unset]">
											{popularProducts.map((product) => (
												<PopularProduct
													key={product.id}
													product={product}
													add={() => addProductById(product.id)}
													openModal={() => setModalProductId(product.id)}
												/>
											))}
										</div>
									</div>
								</section>
							)}
							{subscriptions && subscriptions.length >= 1 && (
								<section className="mt-4">
									<div className="mt-12 flex flex-col items-center justify-between space-y-2 sm:flex-row sm:space-y-0">
										<Title size="medium" className="font-semibold">
											Subscriptions
										</Title>
									</div>
									<div
										className="col-auto mt-4 grid place-items-center justify-center gap-x-8 gap-y-7 phone:justify-between"
										style={{
											gridTemplateColumns: "repeat(auto-fit, minmax(224px, auto))", // 224px is the width of the product card
										}}
									>
										{subscriptions.map((product) => (
											<Product
												key={product.id}
												product={product}
												add={() => addProductById(product.id)}
												openModal={() => setModalProductId(product.id)}
											/>
										))}
									</div>
								</section>
							)}
							{products && products.length >= 1 && (
								<section className="mt-12 mb-12">
									<Title size="medium" className="text-center font-semibold phone:text-left">
										Items
									</Title>
									<div
										className={clsx(
											"mt-4 grid gap-x-8 gap-y-7",
											products.length >= 1 && products.length < 5
												? "justify-start"
												: "justify-center phone:justify-between"
										)}
										style={{
											gridTemplateColumns: "repeat(auto-fit, minmax(224px, auto))", // 224px is the width of the product card
										}}
									>
										{products.map((product) => (
											<Product
												key={product.id}
												product={product}
												add={() => addProductById(product.id)}
												openModal={() => setModalProductId(product.id)}
											/>
										))}
									</div>
								</section>
							)}
						</>
					)}
				</Container>
			)}
		</>
	);
}

export const getServerSideProps: GetServerSideProps = withSession(
	async (ctx: GetServerSidePropsContext & { req: { session: Session } }) => {
		const user = (await ctx.req.session.get("user")) as User;
		if (!user) {
			return {
				redirect: {
					destination: `/api/auth/login?redirect=${encodeURIComponent(ctx.resolvedUrl)}`,
					permanent: false,
				},
			};
		}

		const db = await dbConnect();
		const dbUser = (await db.collection("users").findOne({ _id: user.id })) as UserData;
		// Check request headers for cloudflare country header
		let country = ctx.req.headers["cf-ipcountry"] ?? "??";
		return {
			props: {
				user,
				banned: await db.collection("bans").findOne({ id: user.id, type: "lootbox" }),
				country,
				cart: (await ctx.req.session.get("cart")) ?? [],
				verification: {
					verified: dbUser.ageVerification?.verified ?? false,
					years: dbUser.ageVerification?.years ?? 0,
				},
			},
		};
	}
);
