import clsx from "clsx";
import { ReactNode } from "react";

interface Props {
	icons: ReactNode[];
	selected: boolean;
	select: any;
}

export default function PaymentOption({ icons, selected, select }: Props) {
	return (
		<div
			className={clsx(
				"mr-3 flex cursor-pointer select-none items-center justify-center rounded-md border py-[6px] px-3",
				selected ? "border-dank-300" : "border-black/30 dark:border-white/30"
			)}
			onClick={select}
		>
			<div
				className={clsx(
					"relative mr-2 grid h-3 min-w-[0.75rem] place-items-center rounded-full border-2",
					selected ? "border-dank-300" : "border-black/30 dark:border-white/30"
				)}
			>
				{selected && <div className="absolute h-1 w-1 rounded-full bg-dank-300"></div>}
			</div>
			<div className="flex gap-x-[0.3rem]">{icons}</div>
		</div>
	);
}
