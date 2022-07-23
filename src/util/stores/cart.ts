import { CartItem } from "src/pages/store";
import Stripe from "stripe";
import create, { StateCreator, StoreApi } from "zustand";
import { persist } from "zustand/middleware";
import { getSelectedPriceValue } from "../store";

interface CartState {
	readonly items: CartItem[];
	readonly total: number;
	addItem: (item: CartItem) => any;
	removeItem: (id: string) => any;
	setItemQuantity: (id: string, qty: number) => any;
	increaseItemQuantity: (id: string) => any;
	decreaseItemQuantity: (id: string) => any;
	changeInterval: (id: string, interval: Stripe.Price.Recurring.Interval) => any;
	setCart: (items: CartItem[]) => any;
	clearCart: () => any;
}

const calculateTotal =
	<T extends object, U extends object>(create: PopArgument<StateCreator<T, [], []>>, calculate: (state: T) => U) =>
	(set: StoreApi<T>["setState"], get: StoreApi<T>["getState"], api: StoreApi<T>): T & U => {
		const setAfterCalculatedTotal: StoreApi<T>["setState"] = (update, replace) => {
			set((state) => {
				const updated = typeof update === "object" ? update : update(state);
				const calculatedTotal = calculate({ ...state, ...updated });
				return { ...updated, ...calculatedTotal };
			}, replace);
		};
		api.setState = setAfterCalculatedTotal;
		const state = create(setAfterCalculatedTotal, get, api);
		return { ...state, ...calculate(state) };
	};

type PopArgument<T extends (...a: never[]) => unknown> = T extends (...a: [...infer A, infer _]) => infer R
	? (...a: A) => R
	: never;

export const useCart = create(
	persist<CartState>(
		calculateTotal(
			(set, get) => ({
				items: [],
				total: 0,
				addItem: (item: CartItem) => {
					const current = get().items;
					const exists = current.findIndex((possible) => possible.id === item.id);
					if (current[exists] && current[exists].quantity >= 1 && current[exists].quantity < 100) {
						current[exists].quantity += 1;
						set({ items: current });
					} else {
						set({ items: [...current, item] });
					}
				},
				removeItem: (id: string) => {
					const current = get().items;
					const exists = current.findIndex((possible) => possible.id === id);
					if (exists) {
						current.splice(exists, 1);
						set({ items: current });
					}
				},
				setItemQuantity: (id: string, qty: number) => {
					const current = get().items;
					const exists = current.findIndex((possible) => possible.id === id);
					if (current[exists] && qty >= 1 && qty < 100) {
						current[exists].quantity = qty;
						set({ items: current });
					}
				},
				increaseItemQuantity: (id: string) => {
					const current = get().items;
					const exists = current.findIndex((possible) => possible.id === id);
					if (current[exists] && current[exists].quantity >= 1 && current[exists].quantity < 100) {
						current[exists].quantity += 1;
						set({ items: current });
					}
				},
				decreaseItemQuantity: (id: string) => {
					const current = get().items;
					const exists = current.findIndex((possible) => possible.id === id);
					if (current[exists] && current[exists].quantity >= 1 && current[exists].quantity < 100) {
						current[exists].quantity -= 1;
						set({ items: current });
					}
				},
				changeInterval: (id: string, interval: Stripe.Price.Recurring.Interval) => {
					const current = get().items;
					const exists = current.findIndex((possible) => possible.id === id);
					if (current[exists]) {
						current[exists].selectedPrice = current[exists].prices.find(
							(price) => price.interval?.period === interval
						)?.id!;
						set({ items: current });
					}
				},
				setCart: (items: CartItem[]) => set({ items }),
				clearCart: () => set({ items: [] }),
			}),
			(state) => {
				return {
					total: state.items.reduce(
						(acc: number, item: CartItem) =>
							acc + (getSelectedPriceValue(item, item.selectedPrice).value / 100) * item.quantity,
						0
					),
				};
			}
		),
		{
			name: "cart",
			getStorage: () => sessionStorage,
		}
	)
);
