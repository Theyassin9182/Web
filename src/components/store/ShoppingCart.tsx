import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Title } from "../Title";
import Button from "../ui/Button";
import { Icon as Iconify } from "@iconify/react";
import { useCart } from "src/util/hooks/useCart";
import { getSelectedPriceValue } from "src/util/store";
import { CartItem as ICartItem } from "src/pages/store";
import CartItem from "./cart/CartItem";
import axios from "axios";
import { CartMap } from "src/util/cart";

interface Props {
	hovered: Dispatch<SetStateAction<boolean>>;
}

export default function ShoppingCart({ hovered }: Props) {
	const router = useRouter();
	const { cart, error, mutate, controller, isLoading } = useCart();
	const itemCount = cart.reduce((prev, curr) => prev + curr.quantity, 0);
	const total =
		cart.length >= 1
			? cart
					.reduce(
						(acc: number, item: ICartItem) =>
							acc + (getSelectedPriceValue(item, item.selectedPrice)!.value / 100) * item.quantity,
						0
					)
					.toFixed(2)
			: "0.00";

	const [showCart, setShowCart] = useState(false);
	// Thanks badosz
	let timeoutEnter: NodeJS.Timeout;

	const deleteItem = async (id: string) => {
		// const oldCart = cart;
		// oldCart.splice(index, 1);
		// mutation.mutate(oldCart);
		// if (oldCart.length < 1) setShowCart(false);
	};

	const updateQuantity = (index: number, quantity: number) => {
		// const oldCart = cart;
		// oldCart[index].quantity = quantity;
		// mutation.mutate(oldCart);
	};

	const changeInterval = (index: number, interval: "month" | "year") => {
		// const oldCart = cart;
		// oldCart[index].selectedPrice = oldCart[index].prices.filter(
		// 	(price) => price.interval?.period === interval
		// )[0].id;
		// mutation.mutate(oldCart);
	};

	const buttonEnter = () => {
		timeoutEnter = setTimeout(() => {
			setShowCart(true);
		}, 300);
	};

	const buttonLeave = () => {
		if (showCart) {
			clearTimeout(timeoutEnter);
			setShowCart(false);
		}
	};

	useEffect(() => {
		hovered(showCart);
	}, [showCart]);

	return (
		<div onMouseEnter={buttonEnter} onMouseLeave={buttonLeave}>
			<Button size="small" className="w-full sm:w-auto" variant="dark" onClick={() => router.push(`/store/cart`)}>
				<div className="flex items-center space-x-2 py-1">
					<Iconify icon="akar-icons:cart" className="text-black dark:text-white" height={20} />
					<p>
						{!isLoading || itemCount >= 1
							? `${itemCount} item${itemCount === 1 ? "" : "s"} for $${total}`
							: "Shopping cart"}
					</p>
				</div>
			</Button>
			{showCart &&
				(cart.length >= 1 ? (
					<div className="absolute right-0 z-10 w-screen max-w-md pt-2 motion-safe:animate-slide-in">
						<div className="w-full rounded-md bg-neutral-200 py-3 px-4 dark:bg-dank-600">
							<Title size="small">Your cart</Title>
							<div className="flex flex-col">
								<div>
									{cart.map((item, i) => (
										<CartItem
											key={item.id}
											size="small"
											index={i}
											{...item}
											changeInterval={changeInterval} // Not done
											setQuantity={mutate.setQty}
											increaseQuantity={mutate.incrQty}
											decreaseQuantity={mutate.decrQty}
											deleteItem={mutate.delItem}
											disabled={false}
										/>
									))}
								</div>
								<div className="mt-5 flex justify-end">
									<div className="flex w-2/3 flex-col">
										<div className="flex w-full justify-between rounded-lg bg-neutral-300 px-4 py-3 dark:bg-dank-500">
											<Title size="small">Subtotal:</Title>
											<Title size="small">${total}</Title>
										</div>
										<Button className="mt-2 w-full" onClick={() => router.push("/store/cart")}>
											Review cart
										</Button>
									</div>
								</div>
							</div>
						</div>
					</div>
				) : (
					<div className="absolute right-0 z-50 pt-2">
						<div className="w-96 rounded-md bg-neutral-200 py-2 px-3 dark:bg-dank-600">
							<h4 className="text-lg font-bold">Your cart</h4>
							<div className="my-6 flex flex-col">
								<p className="mx-auto w-3/4 text-center opacity-50">
									You don't have anything in your cart, add something from the store for it to show up
									here!
								</p>
							</div>
						</div>
					</div>
				))}
		</div>
	);
}
