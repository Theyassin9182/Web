import {
	Component,
	createContext,
	Dispatch,
	ReactNode,
	SetStateAction,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { STORE_MINIMUM_DISCOUNT_VALUE, STORE_TAX_PERCENT } from "src/constants";
import { CartItem } from "src/pages/store";
import { useCart, useCartImpl } from "src/util/hooks/useCart";
import { useDiscount, useDiscountImpl } from "src/util/hooks/useDiscount";
import { getSelectedPriceValue } from "src/util/store";

interface Props {
	children: ReactNode;
}

export interface StoreConfiguration {
	isGift: boolean;
	giftRecipient: string;
	acceptDiscounts: boolean;
}

export interface CartInformation {
	subtotal: number;
	salesTax: number;
	total: number;
	meetsThreshold: boolean;
}

export interface StoreContextImpl {
	cartContext: useCartImpl;
	discountContext: useDiscountImpl;
	config: Partial<StoreConfiguration>;
	setConfig: Dispatch<SetStateAction<Partial<StoreConfiguration>>>;
	info: Partial<CartInformation>;
	setInfo: Dispatch<SetStateAction<Partial<CartInformation>>>;
}

export const StoreContext = createContext<StoreContextImpl | undefined>(undefined);
export default function StoreProvider({ children }: Props) {
	const cartContext = useCart();
	const discountContext = useDiscount();
	const previousCart = useRef(cartContext.cart);

	const [config, setConfig] = useState<Partial<StoreConfiguration>>({
		isGift: false,
		giftRecipient: "",
		acceptDiscounts: false,
	});

	const subtotal =
		!cartContext?.isValidating && cartContext?.cart.length >= 1
			? cartContext?.cart.reduce(
					(acc: number, item: CartItem) =>
						acc + ((getSelectedPriceValue(item, item.selectedPrice)?.value ?? 100) / 100) * item.quantity,
					0
			  )
			: 0;
	const salesTax = subtotal * (STORE_TAX_PERCENT / 100);
	const total = subtotal + salesTax - discountContext.discount.totalSavings;
	const meetsThreshold = total >= STORE_MINIMUM_DISCOUNT_VALUE && cartContext?.cart[0].type !== "subscription";

	const [info, setInfo] = useState<Partial<CartInformation>>({
		subtotal: subtotal ?? 0,
		salesTax: salesTax ?? 0,
		total: total ?? 0,
		meetsThreshold: meetsThreshold ?? false,
	});

	useEffect(() => {
		const diff = cartContext.cart.filter((x) => !previousCart.current.includes(x));
		previousCart.current = cartContext.cart;
		if (diff.length >= 1) {
			setInfo({
				subtotal: subtotal ?? 0,
				salesTax: salesTax ?? 0,
				total: total ?? 0,
				meetsThreshold: meetsThreshold ?? false,
			});
		}
	}, [cartContext.cart]);

	return (
		<StoreContext.Provider value={{ cartContext, discountContext, config, setConfig, info, setInfo }}>
			{children}
		</StoreContext.Provider>
	);
}
