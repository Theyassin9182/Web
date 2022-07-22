import { Icon as Iconify } from "@iconify/react";
import clsx from "clsx";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "../ui/Link";

interface Props {
	icon: string;
	size?: number;
	text: string;
	href: string;
}

export default function Navlink({ icon, size = 22, text, href }: Props) {
	const router = useRouter();
	const [active, setActive] = useState(router.route === href || router.route.endsWith(href));

	useEffect(() => {
		setActive(router.route === href || router.route.endsWith(href));
	}, [router.route]);

	return (
		<Link href={href}>
			<div className="group mb-3 flex cursor-pointer items-center justify-center rounded-md transition-colors xl:justify-start">
				<div
					className={clsx(
						active && "shadow-[inset_0_0_8px] shadow-dank-100/80 xl:shadow-none",
						"grid min-h-[40px] min-w-[40px] place-items-center rounded-md bg-dank-200 fill-white dark:bg-[#175a34] xl:mr-4"
					)}
				>
					<Iconify icon={icon} color="white" height={size} />
				</div>
				<p
					className={clsx(
						active ? "text-dank-300" : "text-gray-800 group-hover:text-dank-100 dark:text-white",
						"hidden xl:block"
					)}
				>
					{text}
				</p>
			</div>
		</Link>
	);
}
