import { PaymentRequest } from "@stripe/stripe-js";
import { createContext, Dispatch, ReactNode, SetStateAction, useState } from "react";

interface CheckoutContextImpl {
	invoice: string;
	clientSecret: string;
	receiptEmail: string;
	acceptsIntegratedWallets: boolean;
	integratedWallet: PaymentRequest;
	selectedPaymentOption: "Card" | "PayPal" | "ApplePay" | "GooglePay" | "MicrosoftPay";
	processingPayment: boolean;
	canCheckout: boolean;
	update?: Dispatch<SetStateAction<Partial<CheckoutContextImpl>>>;
}

interface Props {
	children: ReactNode;
	invoice?: string;
	clientSecret?: string;
	receiptEmail?: string;
}

export const CheckoutContext = createContext<Partial<CheckoutContextImpl> | undefined>(undefined);
export function updateContextState<T extends {}>(context: T, field: keyof T, value: any) {
	let newContext = context;
	newContext = { ...context, [field]: value };
	return newContext;
}
export default function CheckoutProvider({ children, invoice = "", clientSecret = "", receiptEmail = "" }: Props) {
	const [context, setContext] = useState<Partial<CheckoutContextImpl>>({
		invoice,
		clientSecret,
		receiptEmail,
		acceptsIntegratedWallets: false,
		canCheckout: false,
		processingPayment: false,
		selectedPaymentOption: "Card",
	});

	return <CheckoutContext.Provider value={{ ...context, update: setContext }}>{children}</CheckoutContext.Provider>;
}
