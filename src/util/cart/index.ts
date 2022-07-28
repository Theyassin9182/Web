import { CartItem } from "src/pages/store";
import Stripe from "stripe";
import mutations from "./mutations";

let cachedController: CartController;
export type CartMap = Map<string, CartItem>;

export function accessCart(cart: CartMap | string = new Map<string, CartItem>()) {
	if (cachedController) return cachedController;
	const controller = new CartController(cart);
	cachedController = controller;
	return controller;
}

export default class CartController {
	private items: CartMap;
	public mutations: typeof mutations;

	constructor(cart: CartMap | string = new Map()) {
		this.mutations = mutations;
		this.items =
			cart instanceof Map
				? cart
				: typeof cart === "string"
				? new Map(Object.entries(JSON.parse(cart)))
				: new Map(Object.entries(cart));
	}

	list(format = true) {
		if (format) return Object.fromEntries(this.items);
		return this.items;
	}

	get(key: string = "", stringify = true) {
		if (key.length >= 1) {
			const item = this.items.get(key);
			if (stringify) {
				return JSON.stringify(item);
			} else {
				return item;
			}
		}
	}

	has(key: string) {
		return this.items.has(key);
	}

	iterable() {
		return Array.from(this.items.values());
	}

	private canAdd(id: string, value: CartItem): boolean {
		const typeToAdd = value.type;
		const hasSubscription = this.iterable().filter((i) => i.type === "subscription").length >= 1;
		const hasSingle = this.iterable().filter((i) => i.type === "single").length >= 1;

		if (this.has(id)) {
			return false;
		}

		if (
			(typeToAdd === "subscription" && (hasSubscription || hasSingle)) ||
			(typeToAdd === "single" && hasSubscription)
		) {
			return false;
		}

		return true;
	}

	addItem(id: string, product: CartItem): Promise<typeof this> {
		return new Promise((resolve, reject) => {
			if (this.canAdd(id, product)) {
				this.items.set(id, product);
				return resolve(this);
			}
			return reject(
				"That item could not be added. Keep in mind that, subscriptions and single-purchase products cannot be mixed."
			);
		});
	}

	delItem(id: string) {
		this.items.delete(id);
		return this;
	}

	/**
	 * @description Overrides the current cart context with the provided cart
	 * @param cart New cart context
	 * @returns this
	 */
	overrideWith(cart: CartMap) {
		this.items = cart;
		return this;
	}

	changeInterval(id: string, interval: Stripe.Price.Recurring.Interval) {
		if (this.items.has(id)) {
			const product = this.items.get(id);
			if (product?.type !== "subscription") {
				throw Error("Changing a item interval is only supported on subscription products.");
			}
			const newPrice = product.prices.find((price) => price.interval!.period === interval);
			if (!newPrice) {
				throw Error(`The selected item does not have an price for the interval ${interval}.`);
			}
			this.items.set(id, { ...product, selectedPrice: newPrice.id });
		}
		return this;
	}

	increaseQuantity(id: string, qty: number = 1) {
		if (this.items.has(id)) {
			const current = this.items.get(id)!;
			this.items.set(id, { ...current, quantity: current.quantity + qty });
		}
		return this;
	}

	decreaseQuantity(id: string, qty: number = 1) {
		if (this.items.has(id)) {
			const current = this.items.get(id)!;
			this.items.set(id, { ...current, quantity: current.quantity - qty });
		}
		return this;
	}

	setItemQuantity(id: string, qty: number) {
		if (this.items.has(id)) {
			const current = this.items.get(id)!;
			this.items.set(id, { ...current, quantity: qty });
		}
		return this;
	}
}
