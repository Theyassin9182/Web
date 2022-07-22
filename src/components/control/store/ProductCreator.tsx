import { ReactNode, useEffect, useState } from "react";
import Input from "src/components/store/Input";
import { Title } from "src/components/Title";
import { Icon as Iconify } from "@iconify/react";
import clsx from "clsx";
import axios, { AxiosError } from "axios";
import Button from "src/components/ui/Button";
import Dropdown from "src/components/ui/Dropdown";
import Checkbox from "src/components/ui/Checkbox";
import ProductCreatorPrice from "./ProductCreatorPrice";
import { toast } from "react-toastify";
import { toTitleCase } from "src/util/string";
import Dialog from "src/components/Dialog";
import { StoreProductCategory } from "src/pages/api/website/static/store/categories/list";

export interface ProductPrice {
	id: string;
	value: string;
	interval?: "Daily" | "Weekly" | "Monthly" | "Annually";
	intervalCount?: string;
}

interface Props {
	forceHide: any;
}

export default function ProductCreator({ forceHide }: Props) {
	const [dialogOpen, setDialogOpen] = useState(false);
	const [canSubmit, setCanSubmit] = useState(false);

	const [productName, setProductName] = useState("");
	const [productPrices, setProductPrices] = useState<ProductPrice[]>([
		{
			id: Math.random().toString(36).slice(2, 7),
			value: "",
		},
	]);
	const [productType, setProductType] = useState<"single" | "subscription">("single");
	const [productCategory, setProductCategory] = useState<string | null>();
	const [productCategories, setProductCategories] = useState<StoreProductCategory[]>([]);

	const [productDescription, setProductDescription] = useState("");

	const [primaryTitle, setPrimaryTitle] = useState("");
	const [primaryBody, setPrimaryBody] = useState("");

	const [secondaryCollapsed, setSecondaryCollapsed] = useState(false);
	const [secondaryEnabled, setSecondaryEnabled] = useState(false);
	const [confirmDeleteSecondary, setConfirmDeleteSecondary] = useState(false);

	const [secondaryTitle, setSecondaryTitle] = useState("");
	const [secondaryBody, setSecondaryBody] = useState("");

	const [creatingProduct, setCreatingProduct] = useState(false);
	const [redirectAfterSubmit, setRedirectAfterSubmit] = useState(false);

	const generateId = (): string => {
		const id = Math.random().toString(36).slice(2, 7);
		if (productPrices.find((price) => price.id === id)) {
			return generateId();
		}
		return id;
	};

	const fetchCategories = async () => {
		axios("/api/website/static/store/categories/list")
			.then(({ data }) => {
				setProductCategories([]);
				setProductCategories(data);
			})
			.catch((e) => {
				toast.error("Failed to load categories");
				if (process.env.NODE_ENV !== "production" && process.env.IN_TESTING) {
					console.error(e);
				}
			});
	};

	useEffect(() => {
		fetchCategories();
	}, []);

	useEffect(() => {
		if (
			productName.length >= 1 &&
			productName.length <= 18 &&
			productType.length >= 1 &&
			productPrices.length >= 1 &&
			productDescription.length <= 250 &&
			primaryTitle.length >= 1 &&
			primaryBody.length >= 1 &&
			(productType === "single" ? productCategory && productCategory.length >= 1 : true) &&
			(secondaryEnabled ? secondaryTitle.length >= 1 && secondaryBody.length >= 1 : true)
		) {
			let allValid: boolean = true;
			if (productType === "subscription") {
				for (const i in productPrices) {
					if (parseFloat(productPrices[i].value.toString()) < 1 && productPrices[i].interval!.length < 1) {
						allValid = true;
						break;
					}
				}
			}
			setCanSubmit(allValid);
		} else {
			setCanSubmit(false);
		}
	}, [
		productName,
		productPrices,
		productType,
		productCategory,
		productDescription,
		primaryTitle,
		primaryBody,
		secondaryEnabled,
		secondaryTitle,
		secondaryBody,
	]);

	useEffect(() => {
		if (productType === "subscription") {
			setProductPrices([
				{
					id: generateId(),
					value: "",
					interval: "Monthly",
					intervalCount: "1",
				},
			]);
		} else if (productType === "single") {
			setProductPrices([
				{
					id: generateId(),
					value: "",
				},
			]);
		}
	}, [productType]);

	const removeSecondary = () => {
		if (!confirmDeleteSecondary && (secondaryTitle.length >= 1 || secondaryBody.length >= 1)) {
			setConfirmDeleteSecondary(true);
		} else {
			setConfirmDeleteSecondary(false);
			setSecondaryEnabled(false);
			setSecondaryTitle("");
			setSecondaryBody("");
		}
	};

	const createProduct = async () => {
		if (canSubmit) {
			setCreatingProduct(true);
			try {
				const { data } = await axios({
					url: "/api/store/product/create",
					method: "POST",
					data: {
						name: productName,
						type: productType,
						category: productCategory,
						prices: productPrices,
						description: productDescription,
						primaryTitle,
						primaryBody,
						secondaryTitle,
						secondaryBody,
					},
				});
				setCreatingProduct(false);
				forceHide();
				if (redirectAfterSubmit) {
					window
						.open(
							`https://dashboard.stripe.com/${
								process.env.NODE_ENV !== "production" && process.env.IN_TESTING ? "test" : ""
							}/products/${data.product}`,
							"_blank"
						)
						?.focus();
				}
			} catch (e) {
				toast.error("Issue while creating product, check response in devtools.");
			}
		}
	};

	const addNewPrice = () => {
		const rawPrices = [...productPrices];
		rawPrices.push({
			id: generateId(),
			value: "",
			interval: "Monthly",
			intervalCount: "",
		});
		setProductPrices(rawPrices);
	};

	const updatePrice = (id: string, values: ProductPrice) => {
		const rawPrices = [...productPrices];
		Object.assign(rawPrices.find((price) => price.id === id)!, values);
		setProductPrices(rawPrices);
	};

	const deletePrice = (id: string) => {
		let rawPrices = productPrices.filter((price) => price.id !== id);
		setProductPrices(rawPrices);
	};

	const categoryCreated = async (id: string) => {
		setDialogOpen(false);
		await fetchCategories();
		setProductCategory(productCategories.find((category) => category.id === id)?.name);
	};

	return (
		<>
			<Dialog open={dialogOpen} onClose={setDialogOpen}>
				<CategoryCreator onSuccess={categoryCreated} />
			</Dialog>
			<Title size="big">Add product</Title>
			<p className="text-neutral-600 dark:text-neutral-400">Create a new purchaseable product for the store.</p>
			<div className="mt-4 space-y-5">
				<div className="w-full space-y-3">
					<div className="flex items-center justify-between space-x-4">
						<div className="w-3/5">
							<Input
								width="w-full"
								type={"text"}
								placeholder={"Dank Memer 2"}
								value={productName}
								onChange={(e) => setProductName(e.target.value)}
								label={
									<>
										Product name
										<sup className="text-red-500">*</sup>
									</>
								}
							/>
						</div>
						<div className="w-2/5">
							<p className="mb-1 text-neutral-600 dark:text-neutral-300">
								Product type
								<sup className="text-red-500">*</sup>
							</p>
							<Dropdown
								content={
									<div
										className={clsx(
											"flex items-center justify-between",
											"rounded-md border border-[#3C3C3C]",
											"bg-light-500 transition-colors dark:bg-black/40 dark:text-neutral-400",
											"w-full px-3 py-2 text-sm"
										)}
									>
										<p>
											{productType === "single"
												? "Single-purchase"
												: productType === "subscription"
												? "Subscription"
												: "Select one"}
										</p>
										<Iconify icon="ic:baseline-expand-more" height={15} className="ml-1" />
									</div>
								}
								options={[
									{
										label: "Single-purchase",
										onClick: () => setProductType("single"),
									},
									{
										label: "Subscription",
										onClick: () => setProductType("subscription"),
									},
								]}
								isInput={false}
								requireScroll={false}
							/>
						</div>
					</div>
					{productType === "subscription" ? (
						<>
							<div className="flex items-center justify-between">
								<p className="mb-1 text-neutral-600 dark:text-neutral-300">
									Prices
									<sup className="text-red-500">*</sup>
								</p>
								<Button variant="dark" size="small" onClick={addNewPrice}>
									Add new price
								</Button>
							</div>

							<div className="space-y-5">
								{productPrices.map((price, i) => (
									<ProductCreatorPrice
										id={price.id}
										value={price.value.toString()}
										interval={price.interval}
										intervalCount={(price.intervalCount || 0).toString()}
										mode={productType}
										updatePrice={updatePrice}
										deletePrice={deletePrice}
									/>
								))}
							</div>
						</>
					) : (
						<div className="flex items-center justify-start space-x-5">
							<div className="w-1/4">
								<Input
									width="w-full"
									type={"text"}
									placeholder={"9.99"}
									value={productPrices[0].value.toString()}
									icon={"bi:currency-dollar"}
									className="!pl-8"
									iconSize={16}
									onChange={(e) => {
										if (!Number.isNaN(e.target.value)) {
											setProductPrices([
												{
													id: generateId(),
													value: e.target.value,
												},
											]);
										}
									}}
									onBlur={(e) => {
										if (!Number.isNaN(parseFloat(e.target.value))) {
											setProductPrices([
												{
													id: generateId(),
													value: parseFloat(e.target.value).toFixed(2),
												},
											]);
										}
									}}
									label={
										<>
											Price
											<sup className="text-red-500">*</sup>
										</>
									}
								/>
							</div>
							<div className="w-2/5">
								<p className="mb-1 text-neutral-600 dark:text-neutral-300">
									Product category
									<sup className="text-red-500">*</sup>
								</p>
								<Dropdown
									content={
										<div
											className={clsx(
												"flex items-center justify-between",
												"rounded-md border border-[#3C3C3C]",
												"bg-light-500 transition-colors dark:bg-black/40 dark:text-neutral-400",
												"w-full px-3 py-2 text-sm"
											)}
										>
											<p>{productCategory ?? "Select one"}</p>
											<Iconify icon="ic:baseline-expand-more" height={15} className="ml-1" />
										</div>
									}
									options={[
										...productCategories.map((category) => ({
											label: category.name,
											onClick: () => setProductCategory(category.name),
										})),
										{
											label: (
												<div className="flex items-center space-x-2 ">
													<Iconify
														icon="ant-design:plus-outlined"
														className="text-dank-300"
													/>
													<p className="text-white">Add new category</p>
												</div>
											),
											onClick: () => setDialogOpen(true),
										},
									]}
									isInput={false}
									requireScroll={false}
								/>
							</div>
						</div>
					)}

					<div className="">
						<label className="mb-1 text-neutral-600 dark:text-neutral-300">Product description</label>
						<textarea
							value={productDescription}
							onChange={(e) => setProductDescription(e.target.value)}
							placeholder={
								"This is purely for Stripe and will not be shown on the store page. It may appear on invoices."
							}
							className="h-20 w-full resize-none rounded-md border border-neutral-300 px-3 py-2 font-inter text-sm focus-visible:border-dank-300 focus-visible:outline-none dark:border-neutral-700 dark:bg-black/30"
						/>
					</div>
				</div>
				<Input
					width="w-full"
					type={"text"}
					placeholder={"Exclusive benefits"}
					defaultValue={"Exclusive benefits"}
					value={primaryTitle}
					onChange={(e) => setPrimaryTitle(e.target.value)}
					label={
						<>
							Primary body title
							<sup className="text-red-500">*</sup>
						</>
					}
				/>
				<div className="">
					<label className="mb-1 text-neutral-600 dark:text-neutral-300">
						Content for '{primaryTitle.length >= 1 ? primaryTitle : "Exclusive benefits"}'
						<sup className="text-red-500">*</sup>
					</label>
					<textarea
						value={primaryBody}
						onChange={(e) => setPrimaryBody(e.target.value)}
						placeholder={"What is so special about this product? Markdown is supported in this field."}
						className="min-h-[38px] w-full resize-y rounded-md border border-neutral-300 px-3 py-2 font-inter text-sm focus-visible:border-dank-300 focus-visible:outline-none dark:border-neutral-700 dark:bg-black/30"
					/>
				</div>
				{!secondaryEnabled && (
					<div className="grid cursor-pointer select-none place-items-center">
						<button
							onClick={() => setSecondaryEnabled(true)}
							className="flex w-full max-w-xs items-center justify-center space-x-2 rounded-lg bg-neutral-200 py-2 text-neutral-500 transition-colors hover:bg-dank-300 hover:text-white dark:bg-dank-400 dark:text-neutral-400 hover:dark:bg-dank-300 hover:dark:text-white"
						>
							<Iconify icon="bx:plus" height={20} />
							<p>Add secondary details</p>
						</button>
					</div>
				)}
				{secondaryEnabled && (
					<div
						className={clsx(
							!secondaryCollapsed && "space-y-4 ",
							"h-max w-full rounded-lg bg-neutral-200/80 py-5 px-4 dark:bg-dank-500"
						)}
					>
						<div
							className="group flex cursor-pointer items-center"
							onClick={() => setSecondaryCollapsed((curr) => !curr)}
						>
							<div className="order-1 h-0.5 flex-none grow bg-neutral-300 dark:bg-neutral-500 group-hover:dark:bg-white"></div>
							<p className="order-2 mx-3 select-none text-neutral-500 dark:text-neutral-400 group-hover:dark:text-white">
								{secondaryCollapsed ? "Expand" : "Collapse"}
							</p>
							<div className="order-3 h-0.5 flex-none grow bg-neutral-300 dark:bg-neutral-500"></div>
						</div>
						<div className={clsx(secondaryCollapsed ? "h-0" : "h-max ", "space-y-4 overflow-hidden")}>
							<div className="">
								<Title size="xsmall">Secondary product information</Title>
								<p className="text-sm text-neutral-600 dark:text-neutral-400">
									These fields are not required, this is would most commonly be used for subscription
									products with included benefits of previous tiers.
								</p>
							</div>
							<Input
								width="w-full"
								type={"text"}
								placeholder={"Also included"}
								defaultValue={"Also included"}
								value={secondaryTitle}
								onChange={(e) => setSecondaryTitle(e.target.value)}
								label={"Secondary body title"}
							/>
							<div className="">
								<label className="mb-1 text-neutral-600 dark:text-neutral-300">
									Content for '{secondaryTitle.length >= 1 ? secondaryTitle : "Also included"}'
								</label>
								<textarea
									value={secondaryBody}
									onChange={(e) => setSecondaryBody(e.target.value)}
									placeholder={
										"What else is so interesting about this product? Markdown is supported in this field."
									}
									className="min-h-[38px] w-full resize-y rounded-md border border-neutral-300 px-3 py-2 font-inter text-sm focus-visible:border-dank-300 focus-visible:outline-none dark:border-neutral-700 dark:bg-black/30"
								/>
							</div>
							<div className="grid select-none place-items-center">
								<button
									onClick={() => removeSecondary()}
									className="flex w-full max-w-xs cursor-pointer items-center justify-center space-x-2 rounded-lg py-2 transition-colors dark:bg-black/30 dark:text-neutral-400 hover:dark:bg-red-500 hover:dark:text-white"
								>
									<Iconify icon="bx:minus" height={20} />
									<p>{confirmDeleteSecondary ? "Confirm removal" : "Remove section"}</p>
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
			<div className="sticky left-0 -bottom-0 w-full bg-neutral-100 py-10 dark:bg-dark-100">
				<Button
					size="medium-large"
					variant={canSubmit ? "primary" : "dark"}
					className={clsx(!canSubmit && "cursor-not-allowed", "w-full")}
					onClick={createProduct}
				>
					{creatingProduct ? (
						<p className="flex">
							<span className="mr-3">
								<svg width="23" height="23" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg">
									<defs>
										<linearGradient x1="8.042%" y1="0%" x2="65.682%" y2="23.865%" id="a">
											<stop stopColor="#fff" stopOpacity="0" offset="0%" />
											<stop stopColor="#fff" stopOpacity=".631" offset="63.146%" />
											<stop stopColor="#fff" offset="100%" />
										</linearGradient>
									</defs>
									<g fill="none" fill-rule="evenodd">
										<g transform="translate(1 1)">
											<path
												d="M36 18c0-9.94-8.06-18-18-18"
												id="Oval-2"
												stroke="url(#a)"
												strokeWidth="2"
											>
												<animateTransform
													attributeName="transform"
													type="rotate"
													from="0 18 18"
													to="360 18 18"
													dur="0.9s"
													repeatCount="indefinite"
												/>
											</path>
											<circle fill="#fff" cx="36" cy="18" r="1">
												<animateTransform
													attributeName="transform"
													type="rotate"
													from="0 18 18"
													to="360 18 18"
													dur="0.9s"
													repeatCount="indefinite"
												/>
											</circle>
										</g>
									</g>
								</svg>
							</span>
							Creating '{productName}'
						</p>
					) : (
						<p>Finalize product</p>
					)}
				</Button>
				<Checkbox state={redirectAfterSubmit} callback={() => setRedirectAfterSubmit((curr) => !curr)}>
					Check this box to automatically be redirected to the Stripe dashboard after finalization. <br />
					<span className="text-dank-300">Useful if you wish to upload an image for the product.</span>
				</Checkbox>
			</div>
		</>
	);
}

export function CategoryCreator({ onSuccess }: { onSuccess: (categoryId: string) => void }) {
	const [categoryName, setCategoryName] = useState("");
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<ReactNode | null>();

	const createCategory = (e: any) => {
		e.preventDefault();
		if (categoryName.length < 1 || categoryName.length > 15) {
			setError(
				<>
					Category names should be{" "}
					<code className="rounded bg-neutral-200 py-0.5 px-2 dark:bg-dark-100">
						1 {"<"} x {"<"} 15
					</code>{" "}
					in length.
				</>
			);
		}
		setPending(true);
		axios({
			url: "/api/website/static/store/categories/create",
			method: "POST",
			data: {
				name: categoryName,
			},
		})
			.then(({ data }) => {
				setPending(false);
				setCategoryName("");
				onSuccess(data.category.id);
			})
			.catch((e: any) => {
				setPending(false);
				if ((e as AxiosError).response?.data.message) {
					setError(<>{(e as AxiosError).response?.data.message}</>);
				}
			});
	};

	useEffect(() => {
		if (error) {
			setTimeout(() => {
				setError(null);
			}, 4000);
		}
	}, [error]);

	return (
		<>
			<Title size="medium" className="font-semibold">
				Create a new Product Category
			</Title>
			<p className="text-neutral-500 dark:text-neutral-400">
				Simply type your desired category name below for it to usable on the store. The category will be
				displayed as written here.
			</p>
			<div className="my-4">
				<Input
					width="w-1/3"
					type={"text"}
					placeholder={"Lootbox"}
					value={categoryName}
					onChange={(e) => setCategoryName(e.target.value)}
					label="Category name"
					required
				/>
				{error && <p className="text-red-400">{error}</p>}
			</div>
			<Button
				onClick={(e) => createCategory(e)}
				loading={{
					state: pending,
					text: "Creating category...",
				}}
			>
				Create
			</Button>
		</>
	);
}
