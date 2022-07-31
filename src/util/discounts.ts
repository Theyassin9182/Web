import { CartItem } from "src/pages/store";
import { DiscountItem } from "src/pages/store/checkout";
import { getSelectedPriceValue } from "./store";

export async function calculateDiscount(
	item: CartItem,
	discountAmount: number,
	isPercent: boolean
): Promise<DiscountItem> {
	const selectedPrice = getSelectedPriceValue(item, item.selectedPrice);
	const itemCost = selectedPrice.value * item.quantity;
	const discountedCost = isPercent ? itemCost - itemCost * discountAmount : itemCost - discountAmount;

	return {
		id: item.id,
		originalCost: itemCost,
		discountedCost: parseFloat((discountedCost / 100).toFixed(2)),
		savings: isPercent ? parseFloat(((itemCost - discountedCost) / 100).toFixed(2)) : -1,
	};
}
