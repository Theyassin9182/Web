import clsx from "clsx";
import { useEffect, useState } from "react";
import { TIME } from "src/constants";
import { ListedProduct } from "src/pages/store";
import { toTitleCase } from "src/util/string";
import Button from "../ui/Button";
import addToCart from "public/img/store/lottie/addToCart.json";
import Lottie from "react-lottie-player/dist/LottiePlayerLight";

interface Props {
	product: ListedProduct;
	canAdd: boolean;
	add: () => void;
	openModal: () => void;
}

export default function Product({ product, canAdd, add, openModal }: Props) {
	const [showAdded, setShowAdded] = useState(false);

	useEffect(() => {
		if (showAdded) {
			setTimeout(() => {
				setShowAdded(false);
			}, 1200);
		}
	}, [showAdded]);

	return (
		<div className="flex flex-col">
			<div className="relative z-0 mb-1 flex h-64 w-56 flex-col rounded-md bg-light-500 dark:bg-dark-100">
				{new Date().getTime() - new Date(product.created * 1000).getTime() <= TIME.month && (
					<Badge variant="new" />
				)}
				<div className="grid h-48 w-56 place-items-center">
					<div
						className="h-28 w-28 bg-contain bg-center bg-no-repeat"
						style={{ backgroundImage: `url('${product.image}')` }}
					/>
				</div>
				<div className="w-full px-5">
					<div className="relative grid place-items-center">
						<Button
							// Needs to use arbitrary values because the animation is behind the button, ruins the effect
							className="w-full hover:bg-[#47aa5b] hover:!bg-opacity-100 hover:dark:bg-[#167a2a] hover:dark:!bg-opacity-100"
							onClick={() => {
								if (canAdd) {
									setShowAdded(true);
									add();
								}
							}}
						>
							{showAdded ? "Added to cart!" : "Add to cart"}
						</Button>
						{showAdded && (
							<Lottie
								className="pointer-events-none absolute -z-10"
								animationData={addToCart}
								loop={false}
								play
							/>
						)}
					</div>
					<p
						className="cursor-pointer text-center text-sm text-neutral-500 underline dark:text-neutral-400"
						onClick={openModal}
					>
						Learn more
					</p>
				</div>
			</div>
			<div className="flex items-start justify-between">
				<div className="flex flex-col">
					<h6 className="font-bold text-neutral-800 dark:text-white">{product.name}</h6>
					<p className="-mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
						{toTitleCase(product.category ?? product.type)}
					</p>
				</div>
				<div className="flex flex-col text-right">
					<h6 className="font-bold text-dank-300">
						${([...product.prices.values()][0].value / 100).toFixed(2)}
					</h6>
					<p className="-mt-1.5 text-sm text-neutral-500  dark:text-neutral-400">
						{product.type === "subscription" ? "per month" : "each"}
					</p>
				</div>
			</div>
		</div>
	);
}

const badgeVariants = {
	sale: {
		text: "SALE",
		color: "bg-red-500",
	},
	new: {
		text: "NEW",
		color: "bg-dank-300",
	},
};

interface BadgeProps {
	variant: keyof typeof badgeVariants;
}

function Badge({ variant }: BadgeProps) {
	return (
		<div className={clsx("absolute left-4 -top-4 py-1 px-3", badgeVariants[variant].color)}>
			<p className="select-none font-montserrat font-bold tracking-wide">{badgeVariants[variant].text}</p>
		</div>
	);
}
