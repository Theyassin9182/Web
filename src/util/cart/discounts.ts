import axios, { AxiosError } from "axios";
import { CartItem } from "src/pages/store";
import { KeyedMutator } from "swr";
import { AppliedDiscount } from "../hooks/useDiscount";

export default class Discounts {
	private mutator: KeyedMutator<AppliedDiscount>;

	constructor(mutator: KeyedMutator<AppliedDiscount>) {
		this.mutator = mutator;
		this.apply = this.apply.bind(this);
	}

	/**
	 * @description Check if a discount code is valid and can be used in the current checkout.
	 * @param code Discount code
	 */
	apply(code: string): Promise<AppliedDiscount> {
		return new Promise(async (resolve, reject) => {
			if (code.length < 1) return reject({ status: -1, message: "Invalid code length." });
			let discount = await this.mutator(async () => {
				try {
					let { data: discount }: { data: AppliedDiscount } = await axios(
						`/api/store/discount/apply?code=${code}`
					);
					return discount;
				} catch (e: any) {
					switch ((e as AxiosError).response?.status) {
						case 403:
							reject("Minimum cart value not met.");
							break;
						case 404:
							reject("Invalid discount code provided.");
							break;
						case 406:
							reject("Discount could not be applied to any items.");
							break;
						case 410:
							reject("Discount code has expired");
							break;
						default:
							reject("Discount code could not be applied.");
							break;
					}
				}
			});
			resolve(discount!);
		});
	}

	async clear() {
		try {
			await axios(`/api/store/discount/remove`);
			await this.mutator();
			return true;
		} catch {
			return false;
		}
	}

	async recalculate(code: string, cart: CartItem[]) {
		await this.mutator(async () => {
			try {
				let { data } = await axios({
					method: "POST",
					url: `/api/store/discount/recalculate`,
					data: { code, cart },
				});
				return data;
			} catch {}
		});
	}
}
