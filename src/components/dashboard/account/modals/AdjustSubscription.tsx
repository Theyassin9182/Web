import clsx from "clsx";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Title } from "src/components/Title";
import Button from "src/components/ui/Button";
import Dropdown from "src/components/ui/Dropdown";
import Link from "src/components/ui/Link";
import { Icon as Iconify } from "@iconify/react";
import { DetailedPriceInterval } from "src/pages/api/store/product/details";
import axios from "axios";
import Stripe from "stripe";
import ConfirmAdjustments from "./ConfirmAdjustments";
import { ListedProduct } from "src/pages/store";

interface Props {
	userId: string;
	isOpen: boolean;
	availableSubscriptions: SubscriptionOption[];
	onAvailableSubscriptionsChange: Dispatch<SetStateAction<SubscriptionOption[]>>;
	current: Omit<SubscriptionOption, "price"> & { price: string };
}

export interface SubscriptionOption {
	id: string;
	name: string;
	image: string;
	price: SubscriptionOptionPrice;
	interval: DetailedPriceInterval;
}

interface SubscriptionOptionPrice {
	id: string;
	value: string; // Formatted string
}

export default function AdjustSubscription({
	userId,
	isOpen,
	availableSubscriptions,
	onAvailableSubscriptionsChange,
	current,
}: Props) {
	const [confirmChanges, setConfirmChanges] = useState(false);
	const [subscriptions, setSubscriptions] = useState(availableSubscriptions);
	const [selectedTier, setSelectedTier] = useState<string>(current.id);
	const [selectedPrice, setSelectedPrice] = useState(current.price);
	const [newSubscription, setNewSubscription] = useState<SubscriptionOption>();

	useEffect(() => {
		if (availableSubscriptions.length < 1) {
			axios("/api/store/products/subscriptions/list").then(({ data }: { data: ListedProduct[] }) => {
				const formatted: SubscriptionOption[] = [];
				for (let product of data) {
					for (let price of product.prices) {
						formatted.push({
							id: product.id,
							name: product.name,
							image: product.image,
							price: {
								id: price.id,
								value: `$${(price.value / 100).toFixed(2)}`,
							},
							interval: {
								period: price.interval!.period,
								count: price.interval!.count,
							},
						});
					}
				}
				onAvailableSubscriptionsChange(formatted);
				setSubscriptions(formatted);
			});
		}
	}, []);

	useEffect(() => {
		if (!isOpen) {
			setConfirmChanges(false);
		}
	}, [isOpen]);

	useEffect(() => {
		if (subscriptions.length >= 1) {
			setSelectedPrice(subscriptions.filter((sub) => sub.id === selectedTier)[0].price.id);
		}
	}, [selectedTier]);

	useEffect(() => {
		if (selectedTier !== current.id || selectedPrice !== current.price) {
			const rawSubscription = subscriptions.find(
				(sub) => sub.id === selectedTier && sub.price.id === selectedPrice
			);
			setNewSubscription(rawSubscription);
		}
	}, [selectedTier, selectedPrice]);

	return (
		<>
			{confirmChanges ? (
				<ConfirmAdjustments userId={userId} current={current} newSub={newSubscription!} />
			) : (
				<>
					<Title size="medium" className="font-semibold">
						Change your Subscription
					</Title>
					<p className="text-sm text-neutral-500 dark:text-neutral-400">
						Adjust which subscription tier you are currently subscribed to or change your current billing
						period interval.
					</p>
					<section className="my-5">
						<Title size="small" className="font-semibold">
							Subscription tier
						</Title>
						<p className="text-sm text-neutral-500 dark:text-neutral-400">
							You can view what is included in each subscription tier on{" "}
							<Link href="/store" className="!text-dank-100">
								our store homepage
							</Link>
							.
						</p>
						<div className="mt-3">
							<Dropdown
								content={
									<div
										className={clsx(
											"flex items-center justify-between",
											"rounded-md border border-[#3C3C3C]",
											"bg-light-500 text-neutral-800 transition-colors dark:bg-black/40 dark:text-neutral-400",
											"w-full px-3 py-2 text-sm"
										)}
									>
										<p>
											{selectedTier && subscriptions.find((sub) => sub.id === selectedTier) ? (
												<span className="flex items-center space-x-2">
													<img
														src={
															subscriptions.find((sub) => sub.id === selectedTier)!.image
														}
														width={24}
													/>
													<span>
														{subscriptions.find((sub) => sub.id === selectedTier)!.name}
													</span>
												</span>
											) : (
												"Select one"
											)}
										</p>
										<Iconify icon="ic:baseline-expand-more" height={15} className="ml-1" />
									</div>
								}
								options={[...new Map(subscriptions.map((sub) => [sub["id"], sub])).values()].map(
									(option) => {
										return {
											label: (
												<span className="flex items-center space-x-2 py-1">
													<img src={option.image} width={24} />
													<span>
														{option.name} (from {option.price.value} /{" "}
														{option.interval.period})
													</span>
												</span>
											),
											onClick: () => setSelectedTier(option.id),
										};
									}
								)}
								maxOptionsHeight="!max-h-32"
								requireScroll
							/>
						</div>
					</section>
					<section>
						<Title size="small" className="font-semibold">
							Billing interval
						</Title>
						<p className="text-sm text-neutral-500 dark:text-neutral-400">
							Change how often you are charged for your active subscription.
						</p>
						<div className="mt-3">
							<Dropdown
								content={
									<div
										className={clsx(
											"flex items-center justify-between",
											"rounded-md border border-[#3C3C3C]",
											"bg-light-500 text-neutral-800 transition-colors dark:bg-black/40 dark:text-neutral-400",
											"w-full px-3 py-2 text-sm"
										)}
									>
										<p>
											{selectedPrice && selectedTier ? (
												<span className="flex items-center space-x-2">
													{subscriptions
														.filter((sub) => sub.id === selectedTier)
														.find((sub) => sub.price.id === selectedPrice)?.price.value ??
														current.price}{" "}
													/{" "}
													{subscriptions
														.filter((sub) => sub.id === selectedTier)
														.find((sub) => sub.price.id === selectedPrice)?.interval
														.period ?? current.interval.period}
												</span>
											) : (
												"Select one"
											)}
										</p>
										<Iconify icon="ic:baseline-expand-more" height={15} className="ml-1" />
									</div>
								}
								options={subscriptions
									.filter((sub) => sub.id === selectedTier)
									.map((option) => {
										return {
											label: (
												<span className="flex items-center space-x-2 py-1">
													{option.price.value} / {option.interval.period}
												</span>
											),
											onClick: () => setSelectedPrice(option.price.id),
										};
									})}
								maxOptionsHeight="!max-h-32"
								requireScroll
								reverseOptions
							/>
						</div>
					</section>
					<div className="mt-5 flex w-full items-center justify-end space-x-4">
						<Button
							size="medium"
							variant="primary"
							onClick={(e) => {
								e.preventDefault();
								setConfirmChanges(true);
							}}
							disabled={!newSubscription ? true : false}
						>
							Save changes
						</Button>
					</div>
				</>
			)}
		</>
	);
}
