import clsx from "clsx";

const ProductType = {
	normal: "h-64 w-56",
	popular: "h-40 w-96",
};

interface Props {
	variant: keyof typeof ProductType;
}

export default function LoadingProduct({ variant }: Props) {
	return (
		<div
			className={clsx(ProductType[variant], "mb-1 animate-pulse rounded-md bg-neutral-300 dark:bg-dank-500")}
		></div>
	);
}
