import { CartItem } from "src/pages/store";
import { DiscountItem } from "src/pages/store/checkout";
import { getSelectedPriceValue } from "./store";
import { stripeConnect } from "./stripe";

const stripe = stripeConnect();

export async function calculateDiscount<T extends number>(
	item: CartItem,
	discountAmount: number,
	isPercent: boolean
): Promise<DiscountItem> {
	const { data: priceForProduct } = await stripe.prices.list({
		product: item.id,
	});

	const selectedPrice = getSelectedPriceValue(item, item.selectedPrice);
	const itemCost = selectedPrice.value * item.quantity;
	const discountedCost = isPercent ? itemCost - itemCost * discountAmount : itemCost - discountAmount;

	return {
		id: item.id,
		type: priceForProduct[0].type,
		originalCost: itemCost,
		discountedCost: parseFloat((discountedCost / 100).toFixed(2)),
		savings: isPercent ? parseFloat(((itemCost - discountedCost) / 100).toFixed(2)) : -1,
	};
}
