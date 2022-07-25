import { CartItem } from "src/pages/store";

let cachedController: CartController;
const Omit = <T, K extends keyof T>(Class: new () => T, keys: K[]): new () => Omit<T, typeof keys[number]> => Class;
export type CartMap = Map<string, Omit<CartItem, "id">>;

export function accessCart(cart: CartMap | string = new Map<string, Omit<CartItem, "id">>()) {
    if(cachedController) return cachedController;
    const controller = new CartController(cart);
    cachedController = controller;
    return controller;
}

export default class CartController extends Omit(Map<string, Omit<CartItem, "id">>, ["set", "get", "has"]) {
	items: CartMap;

	constructor(cart: CartMap | string = new Map()) {
		super();
		this.items = typeof cart === "string" ? new Map(Object.entries(JSON.parse(cart))) : new Map(Object.entries(cart));
	}

    private set() {}

    list() {
		return Object.fromEntries(this.items);
    }

	get(key: string = "") {
		if (key.length >= 1) {
			const item = this.items.get(key);
			return JSON.stringify(item);
		}
	}

    has(key: string) {
        return this.items.has(key);
    }

    iterable() {
        return Array.from(this.items.values())
    }

    private canAdd(id: string, value: Omit<CartItem, "id">): boolean {
        const typeToAdd = value.type;
        const hasSubscription = this.iterable().filter((i) => i.type === "subscription").length >= 1;
        const hasSingle = this.iterable().filter(i => i.type === "single").length >= 1;

        if(this.has(id)) {
            return false;
        }

        if(
            (typeToAdd === "subscription" && (hasSubscription || hasSingle)) ||
            (typeToAdd === "single" && hasSubscription)) {
            return false;
        }

        return true;
    }

	addItem(id: string, value: Omit<CartItem, "id">): Promise<typeof this> {
        return new Promise((resolve, reject) => {
            if(this.canAdd(id, value)) {
                this.items.set(id, value);
                return resolve(this);
            } 
            return reject("That item could not be added. Keep in mind that, subscriptions and single-purchase products cannot be mixed.") 
        })
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

	increaseQuantity(id: string, qty: number = 1) {
		if (this.items.has(id)) {
			const current = this.items.get(id)!;
			this.items.set(id, { ...current, quantity: current.quantity + qty });
		}

	}

	decreaseQuantity(id: string, qty: number = 1) {
		if (this.items.has(id)) {
			const current = this.items.get(id)!;
			this.items.set(id, { ...current, quantity: current.quantity - qty });
		}
	}

	setItemQuantity(id: string, qty: number) {
		if (this.items.has(id)) {
			const current = this.items.get(id)!;
			this.items.set(id, { ...current, quantity: qty });
		}
	}
}
