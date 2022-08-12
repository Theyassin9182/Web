import { ReactNode } from "react";
import { Icon as Iconify } from "@iconify/react";
import clsx from "clsx";

interface Props {
	state: any;
	style?: "border" | "fill";
	callback: any;
	children?: ReactNode; // Checkbox label
	className?: string;
}

export default function Checkbox({ state, style = "border", callback, children = <></>, className }: Props) {
	return (
		<div
			className={clsx("mt-2 flex flex-row items-center justify-start", className)}
			onClick={(e) => {
				callback();
				e.stopPropagation();
			}}
		>
			<div
				className={clsx(
					!state ? "border-[#3C3C3C]" : "border-dank-300",
					style === "fill" && state && "!bg-dank-300",
					"relative mr-2 h-4 min-w-[1rem] cursor-pointer rounded border transition-colors dark:bg-black/30"
				)}
			>
				{state && (
					<Iconify
						icon="bx:bx-check"
						height="16"
						className={clsx(
							"absolute top-[-1.5px] left-[-1px]",
							style === "border" ? "text-dank-300" : "text-white"
						)}
					/>
				)}
			</div>
			<p className="text-xs text-neutral-600 dark:text-neutral-300">{children}</p>
		</div>
	);
}
