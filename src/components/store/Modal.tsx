import MarkdownIt from "markdown-it";
import { useEffect, useRef, useState } from "react";
import { tailwindHtml } from "src/util/blog";
import Button from "../ui/Button";
import { toTitleCase } from "../../util/string";
import axios from "axios";
import { ProductDetails } from "src/pages/api/store/product/details";
import LoadingPepe from "../LoadingPepe";
import clsx from "clsx";
import { Icon as Iconify } from "@iconify/react";
import "simplebar/dist/simplebar.min.css";
import SimpleBar from "simplebar-react";

interface Props {
	productId: string;
	add: () => void;
	close?: () => void;
}

export default function Modal({ productId, add, close }: Props) {
	const mdParser = new MarkdownIt();
	const [loading, setLoading] = useState(true);
	const [name, setName] = useState("");
	const [type, setType] = useState("");
	const [image, setImage] = useState("");
	const [prices, setPrices] = useState<ProductDetails["prices"]>([]);
	const [category, setCategory] = useState<ProductDetails["category"]>();
	const [primaryTitle, setPrimaryTitle] = useState("");
	const [primaryContent, setPrimaryContent] = useState<string>();
	const [secondaryTitle, setSecondaryTitle] = useState("");
	const [secondaryContent, setSecondaryContent] = useState<string>();

	const details = useRef<HTMLDivElement | null>(null);
	const [detailsHeight, setDetailsHeight] = useState(0);

	useEffect(() => {
		if (productId.length >= 1) {
			axios(`/api/store/product/details?id=${productId}`)
				.then(({ data }: { data: ProductDetails }) => {
					setName(data.name);
					setType(data.type);
					setImage(data.image);
					setPrices(data.prices);
					setPrimaryTitle(data.body.primary.title);
					setPrimaryContent(data.body.primary.content);

					if (data.category) {
						setCategory(data.category);
					}

					if (data.body.secondary) {
						setSecondaryTitle(data.body.secondary.title ?? "Additional benefits");
						setSecondaryContent(data.body.secondary.content);
					}
					setLoading(false);
				})
				.catch((e) => {
					if (process.env.NODE_ENV !== "production" && process.env.IN_TESTING) {
						console.error(e.message.replace(/"/g, ""));
					}
				});
		}
	}, [productId]);

	useEffect(() => {
		if (detailsHeight === 0 && details.current) {
			console.log(details.current?.clientHeight ?? 0);
			setDetailsHeight(details.current?.clientHeight ?? 0);
		}
	});

	return (
		<>
			{loading ? (
				<LoadingPepe />
			) : (
				<>
					<div
						ref={details}
						className="flex flex-col items-center text-center phone:flex-row phone:items-start phone:text-left"
					>
						<div
							className="mr-4 h-32 w-32 rounded-md bg-black/20 bg-[length:100px_100px] bg-center bg-no-repeat dark:bg-black/40"
							style={{
								backgroundImage: `url('${image}')`,
							}}
						></div>
						<div className="mt-5 phone:mt-0">
							<h1 className="text-2xl font-bold">{name}</h1>
							<p className="text-neutral-800 dark:text-neutral-400">{toTitleCase(category ?? type)}</p>
							<div className="mt-3">
								{prices.length > 1 ? (
									<p>
										From{" "}
										<span className="font-montserrat font-bold text-dank-300">
											${(prices[0].value / 100).toFixed(2)}
										</span>{" "}
										per month
									</p>
								) : (
									<p>
										<span className="font-montserrat font-bold text-dank-300">
											${(prices[0].value / 100).toFixed(2)}
										</span>{" "}
										each
									</p>
								)}
							</div>
							<Button
								size="small"
								className="mt-1"
								onClick={() => {
									add();
									// close();
								}}
							>
								Add to cart
							</Button>
						</div>
					</div>

					<div className="h-screen">
						<SimpleBar
							className="mt-6 w-full pr-4 transition-all phone:pr-0.5"
							style={{
								height: `calc(100% - ${detailsHeight}px - 100px)`,
							}}
							autoHide={false}
						>
							{primaryContent && (
								<>
									<h1 className="text-xl font-bold">{primaryTitle}</h1>
									<p
										dangerouslySetInnerHTML={{
											__html: tailwindHtml(mdParser.render(primaryContent)),
										}}
										className="text-sm text-gray-800 dark:text-neutral-400"
									></p>
								</>
							)}
							{secondaryContent && (
								<>
									<h1 className="mt-5 text-xl font-bold">{secondaryTitle}</h1>
									<p
										dangerouslySetInnerHTML={{
											__html: tailwindHtml(mdParser.render(secondaryContent)),
										}}
										className="text-sm text-gray-800 dark:text-neutral-400"
									></p>
								</>
							)}
						</SimpleBar>
					</div>
				</>
			)}
		</>
	);

	// return (
	// 	<div
	// 		id="modal-background"
	// 		className="absolute top-0 left-0 z-[999999999999] grid h-[100vh] w-[100vw] place-items-center bg-black bg-opacity-70"
	// 		onClick={() => close()}
	// 	>
	// 		<div
	// 			className={clsx(
	// 				"relative px-8 py-7 md:rounded-md",
	// 				"h-screen w-full sm:h-4/6 sm:max-w-[480px]",
	// 				"bg-light-200 text-black dark:bg-dank-500 dark:text-white",
	// 				"motion-safe:animate-slide-in"
	// 			)}
	// 			onClick={(e) => e.stopPropagation()}
	// 		>

	// 		</div>
	// 	</div>
	// );
}
