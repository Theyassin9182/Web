import LinkGroup from "../control/LinkGroup";
import Navlink from "../control/Navlink";
import { Icon as Iconify } from "@iconify/react";
import { useTheme } from "next-themes";
import { User } from "src/types";
import { Avatar } from "../Avatar";

interface Props {
	user: User;
}

export default function DashboardLinks({ user }: Props) {
	const { theme, setTheme } = useTheme();

	return (
		<>
			<LinkGroup title="Account">
				<Navlink icon="ant-design:user-outlined" text="Account overview" href="/dashboard/@me" />
				<Navlink icon="la:file-invoice-dollar" text="Purchase history" href="/dashboard/@me/purchases" />
				{/* <Navlink
					icon="fa6-regular:face-angry"
					text="Infraction history"
					href="/dashboard/infractions"
				/> */}
			</LinkGroup>
			<div className="absolute bottom-5 left-0 ml-6 flex justify-center xl:hidden">
				<Avatar link={user.avatar} size="32" id={user.id} />
			</div>
			<div className="absolute bottom-0 left-0 mb-2 hidden h-16 w-full px-9 xl:block">
				<div className="box-border flex h-14 w-full items-center justify-between rounded-md bg-[#D8DCDE] dark:bg-dank-500">
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
