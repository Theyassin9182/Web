import axios from "axios";
import { CartItem } from "src/pages/store";
import { KeyedMutator } from "swr";
import CartController, { CartMap } from ".";

export default function mutations(mutator: KeyedMutator<CartMap>, controller: CartController) {
	return {
		addItem: async (product: CartItem) => {
			if (!window) throw "Invalid context, mutations can only be called from the frontend!";
			const expectedOutput = controller.addItem(product.id, product);
			await mutator(
				async () => {
					try {
						let { data } = await axios({
							url: `/api/store/cart/add?id=${product.id}`,
							method: "PUT",
							data: product,
						});

						return data.cart;
					} catch {}
				},
				{
					optimisticData: (await expectedOutput).list(false) as CartMap,
					rollbackOnError: true,
					populateCache: true,
					revalidate: false,
				}
			);
		},
	};
}
