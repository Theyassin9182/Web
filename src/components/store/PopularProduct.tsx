import clsx from "clsx";
import { useEffect, useState } from "react";
import { UpsellProduct } from "src/pages/store/cart";
import { toTitleCase } from "src/util/string";
import { Title } from "../Title";
import Button from "../ui/Button";
import addToCart from "public/img/store/lottie/addToCart.json";
import Lottie from "react-lottie-player/dist/LottiePlayerLight";

interface Props {
	product: UpsellProduct;
	add: () => void;
	openModal: () => void;
}

export default function PopularProduct({ product, add, openModal }: Props) {
	const [showAdded, setShowAdded] = useState(false);

	useEffect(() => {
		if (showAdded) {
			setTimeout(() => {
				setShowAdded(false);
			}, 1200);
		}
	}, [showAdded]);

	return (
		<div
			className={clsx(
				"relative h-40 w-96 rounded-md px-5 py-4 xl:transition-shadow",
				"xl:shadow-lg xl:shadow-dank-300/20 xl:hover:shadow-xl xl:hover:shadow-dank-300/20",
				"bg-light-500 dark:bg-dark-100"
			)}
		>
			<div className="flex items-center justify-start space-x-4">
				<div
					className="h-20 w-20 bg-contain bg-center bg-no-repeat"
					style={{
						backgroundImage: `url('${product.image}')`,
					}}
				/>
				<div>
					<Title size="small">{product.name}</Title>
					<p className="-mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
						{product.category ?? toTitleCase(product.type!) + " item"}
					</p>
				</div>
			</div>
			<div className="absolute bottom-4 left-0 w-full px-5">
				<div className="flex w-full items-center justify-between space-x-2 text-base">
					<Button
						size="medium"
						className="z-10 w-8/12"
						onClick={() => {
							setShowAdded(true);
							add();
						}}
					>
						{showAdded ? (
							"Added to cart!"
						) : (
							<>
								{product.type !== "subscription" ? "Purchase for" : "Subscribe from"} $
								{(product.prices[0].value / 100).toFixed(2)}
							</>
						)}
					</Button>
					{showAdded && (
						<Lottie className="pointer-events-none absolute" animationData={addToCart} loop={false} play />
					)}
					<p
						className="cursor-pointer text-center text-neutral-600 underline dark:text-neutral-400"
						onClick={openModal}
					>
						Learn more
					</p>
				</div>
			</div>
		</div>
	);
}
