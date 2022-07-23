import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { CartItem as CartItems } from "src/pages/store";
import { Title } from "../Title";
import Button from "../ui/Button";
import CartItem from "./cart/CartItem";
import { Icon as Iconify } from "@iconify/react";

interface Props {
	totalCost: string;
	cart: CartItems[];
	hovered: Dispatch<SetStateAction<boolean>>;
	setCart: any;
	label: String;
}

export default function ShoppingCart({ totalCost, cart, hovered, setCart, label }: Props) {
	const router = useRouter();
	const [showCart, setShowCart] = useState(false);
	// Thanks badosz
	let timeoutEnter: NodeJS.Timeout;

	const deleteItem = (index: number) => {
		const _cart = [...cart];
		_cart.splice(index, 1);
		setCart(_cart);
		if (_cart.length < 1) setShowCart(false);
	};

	const updateQuantity = (index: number, quantity: number) => {
		const _cart = [...cart];
		_cart[index].quantity = quantity;
		setCart(_cart);
	};

	const changeInterval = (index: number, interval: "month" | "year") => {
		const _cart: CartItems[] = [...cart];
		_cart[index].selectedPrice = _cart[index].prices.filter((price) => price.interval?.period === interval)[0].id;
		setCart(_cart);
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
					<p>{label}</p>
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
											changeInterval={changeInterval}
											updateQuantity={updateQuantity}
											deleteItem={deleteItem}
											disabled={false}
										/>
									))}
								</div>
								<div className="mt-5 flex justify-end">
									<div className="flex w-2/3 flex-col">
										<div className="flex w-full justify-between rounded-lg bg-neutral-300 px-4 py-3 dark:bg-dank-500">
											<Title size="small">Subtotal:</Title>
											<Title size="small">${totalCost}</Title>
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
