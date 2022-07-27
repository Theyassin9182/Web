import axios, { AxiosError } from "axios";
import { CartItem } from "src/pages/store";
import { KeyedMutator } from "swr";
import CartController, { CartMap } from ".";
import { MutationTasks, PossibleMutations } from "src/pages/api/store/cart/mutate";

type MutationActions = typeof PossibleMutations[number] | "add";
type MutationItem<T extends MutationActions> = T extends typeof PossibleMutations[number] ? string : CartItem;
interface MutationOptions {
	quantity: number;
}
export default class Mutations {
	private readonly mutator: KeyedMutator<CartMap>;
	private readonly controller: CartController;

	constructor(mutator: KeyedMutator<CartMap>, controller: CartController) {
		if (!window) throw "Invalid context, mutations can only be called from the frontend!";
		this.mutator = mutator;
		this.controller = controller;
	}

	private sendMutation(
		action: "update",
		item: string,
		task: typeof MutationTasks[number],
		options: MutationOptions
	): Promise<void>;
	private sendMutation(action: "add", item: CartItem, task?: undefined, options?: undefined): Promise<void>;
	private sendMutation(action: "delete", item: string, task?: undefined, options?: undefined): Promise<void>;

	private async sendMutation<T extends MutationActions>(
		action: T,
		item: MutationItem<T>,
		task: T extends "update" ? string : undefined,
		options: T extends "update" ? MutationOptions : undefined
	): Promise<void> {
		return new Promise(async (resolve, reject) => {
			let expectedOutput;
			switch (action) {
				case "add":
					if (typeof item === "string") break;
					expectedOutput = await this.controller.addItem(item.id, item);
					break;
				case "delete":
					if (typeof item !== "string") break;
					expectedOutput = this.controller.delItem(item);
					break;
				case "update":
					if (typeof item !== "string") break;
					expectedOutput = this.controller.delItem(item);
					break;
			}
			if (!expectedOutput) {
				return reject("Failed to construct expected mutation output.");
			}
			await this.mutator(
				async () => {
					try {
						let url =
							action === "add"
								? "/api/store/cart/add"
								: `/api/store/cart/mutate?action=${action}&id=${item}${
										action === "update" ? `&task=${task}` : ""
								  }`;
						let { data } = await axios({
							url,
							method: action === "add" ? "POST" : "PATCH",
							...(action === "add" && { data: { ...(item as CartItem) } }),
							...(action === "update" && { data: { ...options } }),
						});

						return data;
					} catch (e) {
						reject((e as AxiosError).response?.data?.message ?? "Failed to mutate cart");
					}
				},
				{
					optimisticData: expectedOutput.list(false) as CartMap,
					rollbackOnError: true,
					populateCache: true,
					revalidate: false,
				}
			);
			resolve();
		});
	}

	async addItem(product: CartItem) {
		await this.sendMutation("add", product);
	}

	async delItem(id: string) {
		await this.sendMutation("delete", id);
	}

	async incrQty(id: string, quantity: number = 1) {
		await this.sendMutation("update", id, "incrqty", { quantity });
	}

	async decrQty(id: string, quantity: number = 1) {
		await this.sendMutation("update", id, "decrqty", { quantity });
	}

	async setQty(id: string, quantity: number) {
		await this.sendMutation("update", id, "setqty", { quantity });
	}
}
