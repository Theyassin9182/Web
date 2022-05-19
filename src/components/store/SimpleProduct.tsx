import { toast } from "react-toastify";
import { AnyProduct } from "src/pages/store";
import Button from "../ui/Button";

export default function SimpleProduct({
	product,
	contentsString,
	addToCart,
	openModal,
}: {
	product: AnyProduct;
	contentsString: string;
	addToCart: any;
	openModal: any;
}) {
	return (
		<div className="flex h-64 w-52 flex-col items-center justify-center rounded-lg border-[1px] border-neutral-300 bg-light-500 dark:border-neutral-800 dark:bg-[#060A07]">
			<div
				className="h-[90px] w-[90px]"
				style={{
					backgroundImage: `url('${product.images[0]}')`,
					backgroundSize: "contain",
					backgroundPosition: "center",
				}}
			></div>
			<div className="mt-4 text-center">
				<h3 className="text-xl font-bold leading-tight text-dark-200 dark:text-light-100">
					{product.name}
				</h3>
				<p className="text-base leading-tight text-light-600">
					${(product.prices[0].price / 100).toFixed(2)}
				</p>
			</div>
			<div className="mt-6 flex flex-col">
				{product.metadata.hidden ? (
					<Button
						size="small"
						variant="dark"
						onClick={() => {
							toast.info(
								"This product is hidden from normal users. A product image needs to be added before it can be purchased."
							);
						}}
					>
						Unavailable
					</Button>
				) : (
					<Button
						size="small"
						onClick={() =>
							addToCart({
								id: product.id,
								name: product.name,
								selectedPrice: {
									...product.prices[0],
									type: "one_time",
								},
								prices: product.prices,
								unit_cost: parseFloat(
									(product.prices[0].price / 100).toFixed(2)
								),
								quantity: 1,
								metadata: product.metadata,
								image: product.images[0],
							})
						}
					>
						Add to cart
					</Button>
				)}
				<p
					className="mt-1 cursor-pointer text-xs text-dank-300 underline dark:text-[#6A6C6A]"
					onClick={openModal}
				>
					{contentsString}
				</p>
			</div>
		</div>
	);
}