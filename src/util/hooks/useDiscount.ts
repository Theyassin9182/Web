import useSWR from "swr";
import { DiscountItem } from "src/pages/store/checkout";
import Discounts from "../cart/discounts";
import axios, { AxiosError } from "axios";

export interface AppliedDiscount {
	code: string;
	discountedItems: DiscountItem[];
	totalSavings: number;
	isPercent: boolean;
}

export interface useDiscountImpl {
	discount: AppliedDiscount;
	error: any;
	mutate: Discounts;
	isValidating?: boolean;
	isLoading?: boolean;
}

const fetcher = (url: string) =>
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

const doNoRetry = [500, 404, 410, 400, 403, 406];
export const useDiscount = (): useDiscountImpl => {
	const { data, error, mutate, isValidating } = useSWR<AppliedDiscount>("/api/store/discount/get", fetcher, {
		revalidateOnFocus: true,
	});
	if (
		error &&
		(process.env.NODE_ENV === "development" || (process.env.NODE_ENV === "production" && !process.env.IN_TESTING))
	)
		console.error(error);

	return {
		discount: data ?? {
			code: "",
			discountedItems: [],
			totalSavings: 0,
			isPercent: false,
		},
		error,
		mutate: new Discounts(mutate),
		isValidating,
		isLoading: !(!error && !data),
	};
};
