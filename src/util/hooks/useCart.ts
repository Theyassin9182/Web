import useSWR, { Fetcher, KeyedMutator } from "swr";
import axios, { AxiosError } from "axios";
import { CartItem } from "src/pages/store";
import CartController, { accessCart, CartMap } from "../cart";

export const fetcher: Fetcher<CartMap> = (url: string) =>
	axios(url)
		.then((res) => res.data.cart)
		.catch((e) => {
			let error = e as AxiosError;
			const res = new Error("Something went wrong while trying to fetch data.") as Error & {
				info?: string;
				status?: number;
			};
			res.info = error.response?.data.message;
			res.status = error.response?.status;
		});
interface useCartImpl {
	cart: Omit<CartItem, "id">[];
	error: any;
	mutate: KeyedMutator<CartMap>;
	controller: CartController;
}

export const useCart = (): useCartImpl => {
	const { data, error, mutate } = useSWR("/api/store/cart/get", fetcher, {
		revalidateOnFocus: true,
	});

	if (
		error &&
		(process.env.NODE_ENV === "development" || (process.env.NODE_ENV === "production" && !process.env.IN_TESTING))
	)
		console.error(error);

	return {
		controller: accessCart(data),
		cart: accessCart(data).iterable(),
		error,
		mutate,
	};
};
