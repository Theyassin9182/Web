import Stripe from "stripe";
import Button from "../ui/Button";

interface Product extends Stripe.Product {
	price: number;
}

export default function SimpleProduct({
	product,
	contentsString,
	addToCart,
}: {
	product: Product;
	contentsString: string;
	addToCart: any;
}) {
	return (
		<div className="w-52 h-64 bg-light-500 dark:bg-[#060A07] flex flex-col justify-center items-center rounded-lg">
			<img src={product.images[0]} width={90} height={90} />
			<div className="text-center mt-4">
				<h3 className="text-xl font-bold text-dark-200 dark:text-light-100 leading-tight">
					{product.name}
				</h3>
				<p className="text-base text-light-600 leading-tight">
					${(product.price / 100).toFixed(2)}
				</p>
			</div>
			<div className="mt-6 flex flex-col">
				<Button
					size="small"
					onClick={() =>
						addToCart({
							id: product.id,
							name: product.name,
							price: {
								type: "recurring",
								interval: "",
							},
							unit_cost: (product.price / 100).toFixed(2),
							quantity: 1,
							metadata: product.metadata,
						})
					}
				>
					Add to cart
				</Button>
				<p className="underline text-dank-300 dark:text-[#6A6C6A] text-xs cursor-pointer mt-1">
					{contentsString}
				</p>
			</div>
		</div>
	);
}
