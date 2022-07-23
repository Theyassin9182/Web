import axios from "axios";
import { useEffect, useState } from "react";
import { Title } from "src/components/Title";
import Container from "src/components/ui/Container";
import { PageProps, User, UserAge, UserData } from "src/types";
import clsx from "clsx";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
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
import { getSelectedPriceValue } from "src/util/store";
import { Session } from "next-iron-session";
import { dbConnect } from "src/util/mongodb";
import BannedUser from "src/components/store/BannedUser";
import Dialog from "src/components/Dialog";
import AgeVerification from "src/components/store/modals/AgeVerification";
import { STORE_BLOCKED_COUNTRIES, STORE_CUSTOM_MIN_AGE, STORE_NO_MIN_AGE } from "src/constants";
import { useCart } from "src/util/stores/cart";

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
	const cart = useCart();

	const [userCountry, setUserCountry] = useState(country);
	const [modalProductId, setModalProductId] = useState("");
	const [openModal, setOpenModal] = useState(false);
	const [openDialog, setOpenDialog] = useState(false);

	const [processingCartChange, setProcessingCartChange] = useState(false);
	const [cartButtonHovered, setCartButtonHovered] = useState(false);

	const [totalCost, setTotalCost] = useState<string>("...");
	const [cartQuantities, setCartQuantities] = useState(0);
	const [cartItems, setCartItems] = useState<CartItem[] | []>([]);

	const [loadingProducts, setLoadingProducts] = useState(true);
	const [popularProducts, setPopularProducts] = useState<UpsellProduct[]>([]);
	const [subscriptions, setSubscriptions] = useState<ListedProduct[]>([]);
	const [products, setProducts] = useState<ListedProduct[]>([]);

	const [bannerPages, setBannerPages] = useState<BannerPage[]>([]);

	const [requiresAgeVerification, setRequiresAgeVerification] = useState(
		!(
			Object.keys(STORE_NO_MIN_AGE).concat(Object.keys(STORE_BLOCKED_COUNTRIES)).includes(country) &&
			!verification.verified
		) && verification.years < (STORE_CUSTOM_MIN_AGE[userCountry as keyof typeof STORE_CUSTOM_MIN_AGE] ?? 18)
	);
	const getBanners = async () => {
		try {
			const { data: visibleBanners } = await axios("/api/store/banners/list?active=true");
			setBannerPages(visibleBanners);
		} catch (e) {
			if (process.env.NODE_ENV !== "production" && process.env.IN_TESTING) {
				console.error(e);
			}
		}
	};

	const getAllProducts = async () => {
		try {
			let ProductsAPI = axios.create({
				baseURL: "/api/store/products/",
			});
			axios
				.all([
					ProductsAPI.get("/popular"),
					ProductsAPI.get("/one-time/list"),
					ProductsAPI.get("/subscriptions/list"),
				])
				.then(
					axios.spread(async ({ data: popularProds }, { data: singles }, { data: subscriptions }) => {
						setPopularProducts(popularProds);
						setProducts(singles);
						setSubscriptions(subscriptions);
					})
				)
				.catch((e) => {
					if (process.env.NODE_ENV !== "production" && process.env.IN_TESTING) {
						console.error(e);
					}
				})
				.finally(() => {
					setLoadingProducts(false);
				});
		} catch (e) {
			if (process.env.NODE_ENV !== "production" && process.env.IN_TESTING) {
				console.error(e);
			}
		}
	};

	const getCartContents = async () => {
		let { data: cartContents } = await axios("/api/store/cart/get");
		if (!cartContents.cart) return;
		setCartItems(cartContents.cart);
		if (cartContents.cart.length < 1) return;
		setTotalCost(
			cartContents.cart
				.reduce(
					(acc: number, item: CartItem) =>
						acc + (getSelectedPriceValue(item, item.selectedPrice).value / 100) * item.quantity,
					0
				)
				.toFixed(2)
		);
		setCartQuantities(cartContents.cart.reduce((acc: number, item: CartItem) => acc + item.quantity, 0));
	};

	const addToCart = async (item: CartItem) => {
		let toastMessage: string | undefined;
		const typeToAdd = item.type;
		const cartHasSubscription = cartItems.filter((i) => i.type === "subscription").length >= 1;
		const cartHasSingle = cartItems.filter((i) => i.type === "single").length >= 1;

		if (
			typeToAdd === "single" &&
			products.find((product) => product.id === item.id)?.category === "lootbox" &&
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

		cart.addItem(item);
		setProcessingCartChange(false);
	};

	const addProductById = async (id: string) => {
		if (!processingCartChange) {
			try {
				setProcessingCartChange(true);
				const { data: formatted }: { data: CartItem } = await axios(
					`/api/store/product/find?id=${id}&action=format&to=cart-item`
				);
				if (requiresAgeVerification && formatted.category?.toLowerCase() === "lootbox") {
					return setOpenDialog(true);
				}
				addToCart(formatted);
			} catch (e) {
				console.error(e);
				toast.error("We were unable to update your cart information. Please try again later.");
			}
		}
	};

	useEffect(() => {
		if (!banned) {
			getBanners();
			getAllProducts();
			getCartContents();
		}
	}, []);

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
		if (products.length < 1) return;
		axios({
			url: "/api/store/cart/set",
			method: "PUT",
			data: { cartData: cartItems },
		});
		if (cartItems.length < 1) {
			setTotalCost("0.00");
			setCartQuantities(0);
		} else {
			setTotalCost(
				cartItems
					.map(
						(item: CartItem) =>
							(getSelectedPriceValue(item, item.selectedPrice).value / 100) * item.quantity
					)
					.reduce((a: number, b: number) => a + b)
					.toFixed(2)
			);
			setCartQuantities(cartItems.map((item: CartItem) => item.quantity).reduce((a: number, b: number) => a + b));
		}
	}, [cartItems]);

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
					{bannerPages.length >= 1 && (
						<div className={clsx(cartButtonHovered && "-z-10", "sticky mt-3 h-72 w-full max-w-7xl")}>
							<PagedBanner pages={bannerPages} height={"h-72"} />
						</div>
					)}
					{loadingProducts ? (
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
							{popularProducts.length >= 1 && (
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
													canAdd={!processingCartChange}
													add={() => addProductById(product.id)}
													openModal={() => setModalProductId(product.id)}
												/>
											))}
										</div>
									</div>
								</section>
							)}
							{subscriptions.length >= 1 && (
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
												canAdd={!processingCartChange}
												add={() => addProductById(product.id)}
												openModal={() => setModalProductId(product.id)}
											/>
										))}
									</div>
								</section>
							)}
							{products.length >= 1 && (
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
												canAdd={!processingCartChange}
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
				verification: {
					verified: dbUser.ageVerification?.verified ?? false,
					years: dbUser.ageVerification?.years ?? 0,
				},
			},
		};
	}
);
