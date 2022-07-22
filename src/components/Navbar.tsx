import axios from "axios";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { User } from "../types";
import { Avatar } from "./Avatar";
import Button from "./ui/Button";
import Dropdown from "./ui/Dropdown";
import Link from "./ui/Link";

interface Props {
	user?: User;
}

export default function Navbar({ user }: Props) {
	const [hamburger, setHamburger] = useState(false);
	const [mobileAccountExpanded, setMobileAccountExpanded] = useState(false);
	const [notifications, setNotifications] = useState(0);

	useEffect(() => {
		document.documentElement.style.overflow = hamburger ? "hidden" : "auto";
	}, [hamburger]);

	useEffect(() => {
		const handleResize = () => {
			setHamburger(false);
		};

		axios(`/api/community/notifications/count`).then(({ data }) => {
			setNotifications(data.count);
		});

		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	return (
		<>
			<div className="flex items-center justify-center text-lg">
				<nav className="relative z-10 mt-0 flex h-20 w-full max-w-7xl justify-between bg-light-200 p-4 drop-shadow-xl dark:bg-dark-200 dark:drop-shadow-none lg:mt-5 lg:w-11/12 lg:rounded-md">
					<div className="flex items-center">
						<Link href="/">
							<img className="cursor-pointer" src={"/img/memer.png"} alt="Logo" width="42" height="42" />
						</Link>
						<ul className="ml-5 hidden space-x-4 lg:flex">
							<Link href="/commands">Commands</Link>
							<Link href="/faq">FAQ</Link>
							<Link href="/store">
								<div className="flex cursor-pointer items-center space-x-2">
									<span>Store</span>
								</div>
							</Link>
							<Link href="/items">Items</Link>
							<Link href="/community">Community</Link>
						</ul>
						<div className="ml-4 inline-block font-montserrat text-xl font-bold text-gray-800 dark:text-light-200 lg:hidden">
							Dank Memer
						</div>
					</div>
					<div className="relative hidden items-center lg:flex">
						<Link href="https://discord.gg/dankmemerbot">Support</Link>
						{!user && (
							<Link className="pl-4" href="/api/auth/login" variant="primary">
								Login
							</Link>
						)}
						{user && (
							<div className="relative flex h-full items-center pl-4">
								{notifications > 0 && (
									<div className="absolute -right-1 -top-1 z-50 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs">
										{Math.min(notifications, 9)}
										{notifications > 9 ? "+" : ""}
									</div>
								)}
								<Dropdown
									content={
										<div className="flex items-center space-x-2 p-2">
											<Avatar id={user.id} link={user.avatar} size="32px" />
											<div className="text-dark-500 dark:text-white">{user.username}</div>
											<span className="material-icons text-dark-100 dark:text-white">
												expand_more
											</span>
										</div>
									}
									options={[
										user.moderator || user.developer
											? {
													label: "Control Panel",
													link: "/control/website/overview",
											  }
											: null,
										{ label: "Dashboard", link: "/dashboard/@me" },
										{
											label: "Profile",
											link: `/@${user.id}`,
										},
										{
											label: (
												<div className="flex items-center space-x-2">
													<div>Notifications</div>
													{notifications > 0 && (
														<div className="z-50 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-xs">
															{Math.min(notifications, 9)}
															{notifications > 9 ? "+" : ""}
														</div>
													)}
												</div>
											),
											link: `/community/notifications`,
										},
										{
											label: "Appeal a ban",
											link: "/appeals",
										},
										{
											label: "Report a user",
											link: "/reports",
										},
										{
											label: "Logout",
											link: "/api/auth/logout",
											variant: "danger",
										},
									]}
								/>
							</div>
						)}
					</div>
					<div
						className="relative flex cursor-pointer select-none items-center text-dank-500 dark:text-light-100 lg:hidden"
						onClick={() => setHamburger(!hamburger)}
					>
						<span className="material-icons">menu</span>
					</div>{" "}
					{hamburger && (
						<ul className="absolute top-20 left-0 z-50 box-border flex h-screen w-screen flex-col bg-light-200 px-6 text-sm dark:bg-dark-200">
							<div className="flex flex-col space-y-3">
								<Link href="/commands">Commands</Link>
								<Link href="/faq">Frequently asked questions</Link>
								<Link href="/community">Community</Link>
								<Link href="/store">Store</Link>
								<Link href="/items">Items</Link>
							</div>
							{user ? (
								<div className="mt-5 border-t border-dank-600 pt-5">
									<div
										className="flex w-full select-none items-center justify-between"
										onClick={() => setMobileAccountExpanded(!mobileAccountExpanded)}
									>
										<div className="flex items-center">
											<Avatar id={user.id} link={user.avatar} size="64px" className="mr-4" />
											<div>
												<h3 className="font-montserrat font-bold leading-none">
													{user.username}
												</h3>
												<p className="text-sm font-medium italic leading-none text-light-600">
													#{user.discriminator}
												</p>
											</div>
										</div>
										<span
											className="material-icons transition-transform ease-in-out"
											style={{
												transform: `rotate(${mobileAccountExpanded ? 180 : 0}deg)`,
											}}
										>
											expand_more
										</span>
									</div>
									<div
										id="account-links"
										className={clsx(
											"flex flex-col space-y-3 overflow-hidden py-8 pl-3 transition-all ease-in-out",
											mobileAccountExpanded ? "hidden" : "inline-block"
										)}
									>
										<Link href="/community/notifications">Notifications</Link>
										<Link href="/appeals">Appeal a ban</Link>
										<Link href="/reports">Report a user</Link>
										{(user?.moderator || user.developer) && (
											<Link href="/control/website/overview">Control panel</Link>
										)}
										<Link href="/dashboard/@me">Dashboard</Link>
									</div>
									<Button
										className="mt-4"
										variant="danger"
										size="medium"
										block
										href="/api/auth/logout"
									>
										Logout
									</Button>
								</div>
							) : (
								<div className="mt-5 border-t border-dank-600 pt-5">
									<Button variant="primary" size="medium" block href="/api/auth/login">
										Login
									</Button>
								</div>
							)}
						</ul>
					)}
				</nav>
			</div>
		</>
	);
}
