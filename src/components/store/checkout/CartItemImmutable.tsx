import { CartItem } from "src/pages/store";
import { toTitleCase } from "src/util/string";

export default function CartItemImmutable({
	name,
	type,
	prices,
	gifted,
	selectedPrice,
	quantity,
	image,
}: CartItem & { gifted: boolean }) {
	const price = () => {
		return prices.find((price) => price.id === selectedPrice)!;
	};

	return (
		<div className="mt-3 flex w-full items-center justify-between">
			<div className="flex">
				<div
					className="h-12 w-12 rounded-md bg-black/10 bg-[length:33px_33px] bg-center bg-no-repeat dark:bg-black/30"
					style={{
						backgroundImage: `url('${image}')`,
					}}
				></div>
				<div className="ml-5 flex flex-col justify-center">
					<h4 className="font-bold leading-none text-gray-800 dark:text-white">
						{name} <span className="inline font-inter text-sm font-normal sm:hidden">x{quantity}</span>
					</h4>
					<p className="mt-0.5 hidden text-sm leading-none text-light-600 sm:block">
						{gifted && "(Gifted) "}
						{type && toTitleCase(type === "giftable" ? "subscription" : type)}
					</p>
				</div>
			</div>
			<div className="flex flex-col">
				<p className="min-w-[60px] text-right font-montserrat font-bold leading-none text-gray-800 dark:text-white">
					${((price().value / 100) * quantity).toFixed(2)}
				</p>
				{type === "subscription" ? (
					!gifted ? (
						// For normal subscriptions
						<p className="mt-0.5 text-sm leading-none text-light-600">
							Billing period: {toTitleCase(price().interval!.period)}ly
						</p>
					) : (
						// For gifted subscriptions
						<p className="mt-0.5 text-sm leading-none text-light-600">
							Duration: {price().interval!.count} {toTitleCase(price().interval!.period)}
						</p>
					)
				) : (
					<p className="hidden text-sm leading-none text-light-600 sm:block">Quantity: {quantity}</p>
				)}
			</div>
		</div>
	);
}
