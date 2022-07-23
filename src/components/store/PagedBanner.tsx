import clsx from "clsx";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import Button from "../ui/Button";
import type { RequireExactlyOne } from "type-fest";
import axios from "axios";
import { toast } from "react-toastify";

interface Props {
	pages?: BannerPage[];
	displayPage?: BannerPage;
	height?: string;
	duration?: number;
	isStatic?: boolean;
}

export interface BannerPage {
	_id?: string;
	title: string;
	description: string;
	image: string;
	primaryAction: BannerAction;
	secondaryAction?: BannerAction;
	active?: boolean;
	createdBy?: string | BannerCreator;
	createdAt?: number;
	lastUpdated?: number;
	updatedBy?: string | BannerCreator;
}

export interface BannerCreator {
	id: string;
	username: string;
	discriminator: string;
}

interface BannerAction {
	text: string;
	action: PossibleActions;
	input: string;
}

export enum PossibleActions {
	OPEN_LINK = "open-link",
	ADD_TO_CART = "add-to-cart",
}

function useInterval(callback: any, delay: number) {
	const savedCallback = useRef<any>();

	useEffect(() => {
		savedCallback.current = callback;
	}, [callback]);

	useEffect(() => {
		let id = setInterval(() => {
			savedCallback.current();
		}, delay);
		return () => clearInterval(id);
	}, [delay]);
}

export default function PagedBanner({
	pages,
	displayPage,
	height = "h-auto md:h-52",
	duration = 1000,
}: RequireExactlyOne<Props, "pages" | "displayPage">) {
	const router = useRouter();

	const [primaryActionLoading, setPrimaryActionLoading] = useState(false);
	const [paused, setPaused] = useState(false);
	const [timePast, setTimePast] = useState(0);
	const [pageIndex, setPageIndex] = useState(0);
	// This ts-ignore is required because next won't allow the website
	// to build because it doesn't allow the ternary operator to work?

	// @ts-ignore
	const [page, setPage] = useState<BannerPage>(pages ? pages[0] : displayPage);

	useEffect(() => {
		setPage(displayPage!);
	}, [displayPage]);

	useInterval(() => {
		if (!paused && !displayPage && pages && pages.length > 1) {
			if (timePast + 1 >= duration) {
				setPageIndex((curr) => (pages.length - 1 > curr ? curr + 1 : 0));
				setTimePast(0);
			} else {
				setTimePast((time) => time + 1);
			}
		}
	}, 1);

	useEffect(() => {
		if (pages) {
			setPage(pages[pageIndex]);
		}
	}, [pageIndex]);

	const BannerAction = (action: PossibleActions, input: string): { exec: () => any } => {
		switch (action) {
			case PossibleActions.OPEN_LINK:
				return {
					exec: () => router.push(input),
				};
			case PossibleActions.ADD_TO_CART:
				return {
					exec: async () => {
						try {
							setPrimaryActionLoading(true);
							await axios(`/api/store/cart/add?id=${input}`);
							await router.push("/store/cart");
						} catch (e) {
							if (process.env.NODE_ENV !== "production" && process.env.IN_TESTING) {
								console.error(e);
							}
							toast.error("Unable to add product(s) to cart. Please try again later.");
						} finally {
							setPrimaryActionLoading(false);
						}
					},
				};
		}
	};

	return (
		<>
			<svg
				className="imageBlur"
				style={{
					height: "1px",
					width: "1px",
					margin: "-1px",
					position: "absolute",
					zIndex: -1,
				}}
			>
				<filter id="sharpBlur">
					<feGaussianBlur stdDeviation="2"></feGaussianBlur>
					<feColorMatrix type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 9 0"></feColorMatrix>
					<feComposite in2="SourceGraphic" operator="in"></feComposite>
				</filter>
			</svg>

			<div
				className={clsx(
					height,
					"relative flex flex-col justify-center rounded-lg bg-opacity-50 py-4 px-10 text-center md:py-0 md:px-24 md:text-left"
				)}
				onMouseEnter={() => setPaused(true)}
				onMouseLeave={() => setPaused(false)}
			>
				<div
					className={clsx(
						"absolute left-0 top-0 -z-10 min-h-full w-full rounded-lg bg-black/30 bg-cover bg-center bg-no-repeat bg-blend-multiply",
						(!page.image || page.image.length == 0) && "bg-light-500 dark:bg-dark-100"
					)}
					style={{
						backgroundImage: `url("${page.image}")`,
						filter: "url(#sharpBlur)",
					}}
				></div>
				<div className="absolute bottom-12">
					<h1 className="font-montserrat text-3xl font-bold text-light-100">{page.title}</h1>
					<p className="mb-3 text-light-300 drop-shadow">{page.description}</p>
					<div>
						<Button
							variant="primary"
							onClick={() => BannerAction(page.primaryAction.action, page.primaryAction.input).exec()}
							loading={{
								state: primaryActionLoading,
								text: page.primaryAction.text,
							}}
						>
							<div className="flex items-center space-x-2">
								<p>{page.primaryAction.text}</p>
							</div>
						</Button>
						{page.secondaryAction && (
							<p
								onClick={() =>
									BannerAction(page.secondaryAction!.action, page.secondaryAction!.input).exec()
								}
								className="cursor-pointer text-gray-800 underline underline-offset-2 hover:text-dank-300 dark:text-neutral-400 dark:hover:text-dank-100"
							>
								{page.secondaryAction.text}
							</p>
						)}
					</div>
				</div>
				{pages && pages.length > 1 && (
					<div className="absolute left-0 bottom-0 z-20 grid h-5 w-full place-items-center overflow-hidden">
						<div className="flex space-x-3">
							{Array(pages.length)
								.fill(0)
								.map((_, i) => (
									<div
										key={i}
										role={"progressbar"}
										className="h-1 w-8 cursor-pointer overflow-hidden rounded-full bg-white/40"
										onClick={() => {
											setTimePast(0);
											setPageIndex(i);
										}}
									>
										{pageIndex === i && (
											<div
												className="h-full bg-dank-300"
												style={{
													width: (timePast / duration) * 100 + "%",
												}}
											/>
										)}
									</div>
								))}
						</div>
					</div>
				)}
			</div>
		</>
	);
}
