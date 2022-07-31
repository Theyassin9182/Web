import { DetailedPrice } from "src/pages/api/store/product/details";
import { CartItem } from "src/pages/store";

export function getSelectedPriceValue(item: CartItem, selected: string): DetailedPrice {
	return item.prices.find((price) => price.id === selected)!;
}
