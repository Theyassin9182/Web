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
		this.mutator = mutator;
		this.controller = controller;
		this.addItem = this.addItem.bind(this);
		this.delItem = this.delItem.bind(this);
		this.incrQty = this.incrQty.bind(this);
		this.decrQty = this.decrQty.bind(this);
		this.setQty = this.setQty.bind(this);
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
		task: T extends "update" ? typeof MutationTasks[number] : undefined,
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
					switch (task) {
						case "incrqty":
							expectedOutput = this.controller.increaseQuantity(item);
							break;
						case "decrqty":
							expectedOutput = this.controller.decreaseQuantity(item);
							break;
						case "setqty":
							expectedOutput = this.controller.setItemQuantity(item, options?.quantity ?? 1);
							break;
					}
					break;
			}
			if (!expectedOutput) {
				console.log(expectedOutput);
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
							method: action === "add" ? "PUT" : "PATCH",
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
