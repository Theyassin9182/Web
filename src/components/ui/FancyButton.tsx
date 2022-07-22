import Link from "next/link";
import clsx from "clsx";

const variants = {
	big: "text-2xl px-6 py-2",
	small: "text-lg px-6 py-2",
};

interface Props {
	text: string;
	link: string;
	variant?: keyof typeof variants;
}

export default function FancyButton({ text, link, variant = "big" }: Props) {
	return (
		<Link href={link}>
			<div className="group relative block cursor-pointer">
				<a
					className={clsx(
						variants[variant],
						"relative block",
						"border-[3px] border-dank-200 bg-light-200 text-black dark:bg-dark-400 dark:text-white"
					)}
					rel="noreferrer noopener"
				>
					{text}
				</a>
				<div
					className={clsx(
						"absolute top-[7px] left-[7px] -z-10 h-full w-full",
						"border-[3px] border-dank-200",
						"group-hover:top-0 group-hover:left-0",
						"transition-all duration-200 ease-in-out"
					)}
				></div>
			</div>
		</Link>
	);
}
