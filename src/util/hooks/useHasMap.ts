import useSWR, { SWRConfiguration } from "swr";
import { fetcher } from "./useCart";

interface useHasMapResponse<T extends unknown> {
	data: T | null;
	error: any;
	isValidating: boolean;
}

export const useHasMap = <T extends unknown>(
	url: string,
	field: string,
	swrOptions: SWRConfiguration = {},
	isResponseArray: boolean = false
): useHasMapResponse<T> => {
	let { data, error, isValidating } = useSWR<T>(url, fetcher, swrOptions);

	if (!data)
		return {
			data: null,
			error,
			isValidating,
		};

	if (isResponseArray) {
		for (let j of data as T[]) {
			if (!((j as any)[field as keyof T] instanceof Map)) {
				(j as any)[field as keyof T] = new Map(Object.entries((j as any)[field as keyof T]));
			}
		}

		return {
			data: data as T,
			error,
			isValidating,
		};
	}

	return {
		data:
			data instanceof Map
				? data
				: ({ ...{ [field as keyof T]: new Map(Object.entries(JSON.parse(field))), ...(data as {}) } } as T),
		error,
		isValidating,
	};
};
