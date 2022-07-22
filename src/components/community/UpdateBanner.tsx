import clsx from "clsx";
import { useRouter } from "next/router";
import Button from "../ui/Button";

interface Props {
	title: string;
	description: string;
	image: string;
	url: string;
	buttonText: string;
}

export default function UpdateBanner({ title, description, image, url, buttonText }: Props) {
	const router = useRouter();

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

			<div className="relative flex h-auto flex-col justify-center rounded-lg bg-opacity-50 py-4 px-10 text-center md:h-52 md:py-0 md:px-24 md:text-left">
				<div
					className={clsx(
						"absolute left-0 top-0 -z-10 min-h-full w-full rounded-lg bg-cover bg-center bg-no-repeat bg-blend-multiply",
						(!image || image.length == 0) && "bg-light-500 dark:bg-dark-100"
					)}
					style={{
						backgroundImage: `url("${image}")`,
						filter: "url(#sharpBlur)",
					}}
				></div>
				<h1 className="font-montserrat text-3xl font-bold text-light-100">{title}</h1>
				<p className="mb-3 text-light-300 drop-shadow">{description}</p>
				<div>
					<Button variant="primary" onClick={() => router.push(url)}>
						<div className="flex items-center space-x-2">
							<p>{buttonText}</p>
						</div>
					</Button>
				</div>
			</div>
		</>
	);
}
