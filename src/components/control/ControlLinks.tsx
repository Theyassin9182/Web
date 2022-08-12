import LinkGroup from "./LinkGroup";
import Navlink from "./Navlink";
import { Icon as Iconify } from "@iconify/react";
import { useTheme } from "next-themes";
import { User } from "src/types";
import SimpleBar from "simplebar-react";
import "simplebar/dist/simplebar.min.css";
import { useEffect } from "react";
import { offsetVerticalSimplebar } from "src/util/simplebarOffsets";
import { Avatar } from "../Avatar";

interface Props {
	user: User;
	full?: boolean;
}

export default function ControlLinks({ user }: Props) {
	const { theme, setTheme } = useTheme();

	useEffect(() => {
		offsetVerticalSimplebar(-15);
	}, []);

	return (
		<>
			<SimpleBar className="max-h-[670px] w-full xl:short:max-h-[650px] xl:tall:max-h-[750px]" autoHide={false}>
				<LinkGroup title="Website">
					<Navlink icon="bx:bxs-dashboard" text="Website overview" href="/control/website/overview" />
					<Navlink
						icon="fluent:megaphone-loud-24-regular"
						text="Announcements"
						href="/control/website/announcements"
					/>
					<Navlink
						icon="healthicons:city-worker"
						size={24}
						text="Job listings"
						href="/control/website/jobs"
					/>
					<Navlink icon="bx:bxs-file-json" text="Website data" href="/control/website/data" />
				</LinkGroup>
				<LinkGroup title="Users">
					<Navlink icon="la:user-cog" size={24} text="User access control" href="/control/users/access" />
					<Navlink icon="tabler:hammer" text="Bans and Blacklists" href="/control/users/bans-bl" />
					<Navlink icon="tabler:message-report" text="Reports" href="/control/users/reports" />
				</LinkGroup>
				<LinkGroup title="Store">
					<Navlink icon="bx:bx-store" text="Store overview" href="/control/store/overview" />
					<Navlink icon="akar-icons:shipping-box-01" text="Products" href="/control/store/products" />
					<Navlink icon="gg:math-percent" size={30} text="Discounts" href="/control/store/discounts" />
					<Navlink
						icon="fluent:clipboard-bullet-list-rtl-16-regular"
						text="Recent purchases"
						href="/control/store/purchases"
					/>
					<Navlink icon="bx:bx-error" text="Refund requests" href="/control/store/refunds" />
					<Navlink
						icon="fluent:rectangle-landscape-20-filled"
						text="Featured banners"
						href="/control/store/banners"
					/>
				</LinkGroup>
				<LinkGroup title="Miscellaneous" nomb>
					<Navlink icon="ph:users-three" text="All staff" href="/control/staff" />
				</LinkGroup>
			</SimpleBar>
			<div className="absolute bottom-5 left-0 ml-6 flex justify-center xl:hidden">
				<Avatar link={user.avatar} size="32" id={user.id} />
			</div>
			<div className="absolute bottom-0 left-0 mb-2 hidden h-16 w-full px-9 xl:block">
				<div className="box-border flex h-14 w-full items-center justify-between rounded-md bg-slate-300 dark:bg-dank-500">
					<div className="flex items-center justify-start pl-4">
						<Avatar link={user.avatar} size="32" id={user.id} />
						<div className="ml-2">
							<p className="leading-none text-gray-800 dark:text-white">{user.username}</p>
							<p className="text-xs leading-none text-light-600">#{user.discriminator}</p>
						</div>
					</div>
					<div className="hidden items-center justify-end pr-4 xl:flex">
						<Iconify
							icon={theme === "light" ? "fluent:weather-moon-24-filled" : "akar-icons:sun-fill"}
							height="20"
							className="cursor-pointer text-gray-500 transition-all hover:!text-black dark:text-light-600 dark:hover:!text-white"
							onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
						/>
					</div>
				</div>
			</div>
		</>
	);
}
