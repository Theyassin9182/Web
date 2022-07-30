import useSWR, { useSWRConfig } from "swr";
import axios, { AxiosError } from "axios";
import { CartItem } from "src/pages/store";
import CartController, { CartMap } from "../cart/controller";
import Mutations from "../cart/mutations";
import Discounts from "../cart/discounts";
import { useDiscount } from "./useDiscount";

export const fetcher = (url: string) =>
	axios(url)
		.then((res) => res.data)
		.catch((e) => {
			let error = e as AxiosError;
			const res = new Error("Something went wrong while trying to fetch data.") as Error & {
				info?: string;
				status?: number;
			};
			res.info = error.response?.data.message;
			res.status = error.response?.status;
		});
export interface useCartImpl {
	cart: CartItem[];
	data: any[];
	error: any;
	mutate: Mutations;
	controller: CartController;
	isValidating?: boolean;
	isLoading?: boolean;
}

export const useCart = (): useCartImpl => {
	const { data, error, mutate, isValidating } = useSWR<CartMap>("/api/store/cart/get", fetcher, {
		revalidateOnFocus: true,
	});
	if (
		error &&
		(process.env.NODE_ENV === "development" || (process.env.NODE_ENV === "production" && !process.env.IN_TESTING))
	)
		console.error(error);

	const controller = new CartController(data);
	const cart = controller.iterable();

	return {
		controller,
		cart,
		data: [...Object.entries(data ?? {})],
		error,
		mutate: new Mutations(mutate, controller),
		isValidating,
		isLoading: !(!error && !data),
	};
};
