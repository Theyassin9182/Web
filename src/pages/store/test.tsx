import Container from "src/components/ui/Container";
import { PageProps, User } from "src/types";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { withSession } from "src/util/session";
import { Session } from "next-iron-session";
import { Title } from "src/components/Title";
import { useCart } from "src/util/hooks/useCart";
import axios from "axios";
import { useState } from "react";

export default function StoreHome({ user }: PageProps) {
	const { cart, error, mutate, controller } = useCart();
	const [input, setInput] = useState("");

	if (error) return <>Error while loading: {JSON.stringify(error.info)}</>;
	if (!cart) return <>No cart was loaded: {JSON.stringify(cart)}</>;

	return (
		<Container title="Store" user={user}>
			<Title size="big">Test</Title>
			<div className="">
				<ul>
					{cart.map((i) => (
						<li>{i.name}</li>
					))}
				</ul>
			</div>
			<input type="text" value={input} onChange={(e) => setInput(e.target.value)} />
			<button
				onClick={async () => {
					if (input.length < 1) return;
					// @ts-ignore
					const expected = controller.addItem(input, { name: input });

					await mutate(
						async () => {
							try {
								let { data } = await axios({
									url: `/api/store/cart/add?id=${input}`,
									method: "PUT",
									data: {
										name: input,
									},
								});

								return data.cart;
							} catch {}
						},
						{
							// @ts-ignore
							optimisticData: expected,
							rollbackOnError: true,
							populateCache: true,
							revalidate: false,
						}
					);
				}}
			>
				add new item
			</button>
		</Container>
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

		return {
			props: {
				user,
			},
		};
	}
);
