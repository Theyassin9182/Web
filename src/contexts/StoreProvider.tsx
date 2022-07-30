import { Component, createContext, Dispatch, ReactNode, SetStateAction, useContext, useState } from "react";
import { useCart, useCartImpl } from "src/util/hooks/useCart";
import { useDiscount, useDiscountImpl } from "src/util/hooks/useDiscount";

interface Props {
	children: ReactNode;
}

interface StoreConfiguration {
	isGift: boolean;
	giftRecipient: string;
	acceptDiscounts: boolean;
}

export interface StoreContextImpl {
	cartContext: useCartImpl;
	discountContext: useDiscountImpl;
	config: Partial<StoreConfiguration>;
	setConfig: Dispatch<SetStateAction<Partial<StoreConfiguration>>>;
}

export const StoreContext = createContext<StoreContextImpl | undefined>(undefined);
export default function StoreProvider({ children }: Props) {
	const cartContext = useCart();
	const discountContext = useDiscount();
	const [config, setConfig] = useState<Partial<StoreConfiguration>>({
		isGift: false,
		giftRecipient: "",
		acceptDiscounts: false,
	});

	return (
		<StoreContext.Provider value={{ cartContext, discountContext, config, setConfig }}>
			{children}
		</StoreContext.Provider>
	);
}
