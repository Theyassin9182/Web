import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { useContext } from "react";
import { Title } from "src/components/Title";
import Container from "src/components/ui/Container";
import { PageProps } from "src/types";
import { withSession } from "src/util/session";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import CartItemImmutable from "src/components/store/checkout/CartItemImmutable";
import CheckoutForm from "src/components/store/checkout/CheckoutForm";
import StoreBreadcrumb from "src/components/store/StoreBreadcrumb";
import { Session } from "next-iron-session";
import { useCart } from "src/util/hooks/useCart";
import { StoreContext } from "src/contexts/StoreProvider";
import CheckoutProvider from "src/contexts/CheckoutProvider";
import { checkoutSetup, CheckoutSetupImpl } from "src/util/store/checkout";
import { STORE_TAX_PERCENT } from "src/constants";
import CartController from "src/util/cart/controller";

const rawStripeElementsOptions: StripeElementsOptions = {};
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export interface DiscountItem {
	id: string;
	originalCost: number;
	discountedCost: number;
	savings: number;
}

interface Props extends PageProps {
	setup: CheckoutSetupImpl;
}

export default function Checkout({ user, setup }: Props) {
	const { cart, isValidating } = useCart();
	const storeContext = useContext(StoreContext);

	return (
		<Elements
			stripe={stripePromise}
			options={{
				...rawStripeElementsOptions,
				clientSecret: setup.client_secret,
			}}
		>
			<CheckoutProvider invoice={setup.invoice} clientSecret={setup.client_secret} receiptEmail={user!.email}>
				<Container title="Checkout" user={user}>
					<div className="mb-36 lg:mb-16">
						<div className="mt-12 mb-5 flex flex-col items-center justify-between space-y-2 sm:flex-row sm:space-y-0">
							<Title size="big">Checkout</Title>
						</div>
						<StoreBreadcrumb currentPage="checkout" />
						<div className="flex flex-1 flex-col justify-between lg:flex-row">
							<CheckoutForm user={user} />
							<div className="relative hidden w-full lg:ml-5 lg:block">
								<div className="relative h-full w-full rounded-lg bg-light-500 px-8 py-7 dark:bg-dark-200">
									<Title size="small">Shopping cart</Title>
									<div className="flex h-full flex-col items-end justify-between pb-7">
										<div className="w-full">
											{cart &&
												cart.map((item) => (
													<CartItemImmutable
														key={item.id}
														{...item}
														gifted={storeContext?.config.isGift ?? false}
													/>
												))}
										</div>
										<div>
											<p className="text-right text-sm text-neutral-600 dark:text-neutral-300/50">
												Added sales tax: $
												{!isValidating && storeContext?.info.salesTax?.toFixed(2)}
											</p>
											<div className="flex w-full max-w-[260px] justify-between space-x-2 rounded-lg bg-neutral-300 px-4 py-3 dark:bg-dank-500">
												<Title size="small">Subtotal:</Title>
												<Title size="small">
													$
													{!isValidating &&
														(
															storeContext?.info.subtotal! +
															storeContext?.info.subtotal! * (STORE_TAX_PERCENT / 100)
														).toFixed(2)}
												</Title>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</Container>
			</CheckoutProvider>
		</Elements>
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

		const controller = new CartController(ctx.req.session.get("cart"));
		if (controller.iterable().length < 1)
			return {
				redirect: {
					destination: `/store`,
					permanent: false,
				},
			};

		const setup = await checkoutSetup(ctx.req);

		return {
			props: { user, setup },
		};
	}
);
