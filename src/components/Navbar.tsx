import Link from "next/link";
import { useEffect, useState } from "react";
import { User } from "../types";
import Dropdown from "./ui/Dropdown";

interface Props {
	user?: User;
}

export default function Navbar({ user }: Props) {
	const [hamburger, setHamburger] = useState(false);

	useEffect(() => {
		document.documentElement.style.overflow = hamburger ? "hidden" : "auto";
	}, [hamburger]);

	useEffect(() => {
		window.addEventListener("resize", () => setHamburger(false));
	}, []);

	return (
		<div className="flex justify-center items-center text-lg">
			<nav className="max-w-7xl bg-dank-250 rounded-md flex justify-between p-4 mt-0 lg:mt-5 w-full lg:w-11/12">
				<div className="flex items-center">
					<Link href="/">
						<img
							className="cursor-pointer"
							src={"/img/memer.png"}
							alt="Logo"
							width="42"
						/>
					</Link>
					<ul className="ml-5 space-x-4 hidden lg:flex">
						<li className="inline-block hover:text-dank-50">
							<Link href="/commands">Commands</Link>
						</li>
						<li className="inline-block hover:text-dank-50">
							<Link href="/faq">FAQ</Link>
						</li>
						<li className="inline-block hover:text-dank-50">
							<Link href="/blogs">Blog</Link>
						</li>
						<li className="inline-block hover:text-dank-50">
							<Link href="/items">Items</Link>
						</li>
						<li className="inline-block hover:text-dank-50">
							<Link href="/feedback">Feedback</Link>
						</li>
					</ul>
					<div className="ml-4 text-xl font-montserrat font-bold inline-block lg:hidden">
						Dank Memer
					</div>
				</div>

				<div className="items-center relative hidden lg:flex">
					<Link href="https://discord.gg/meme">
						<a
							className="inline-block hover:text-dank-50"
							rel="noreferrer noopener"
						>
							Support
						</a>
					</Link>
					{!user && (
						<Link href="/api/auth/login">
							<a
								className="inline-block text-dank-100 pl-4"
								rel="noreferrer noopener"
							>
								Login
							</a>
						</Link>
					)}
					{user && (
						<div className="pl-4 h-full">
							<Dropdown
								content={
									<div className="flex items-center space-x-2">
										<img
											className="w-8 rounded-full bg-dank-250"
											src={user.avatar}
										/>
										<div>{user.username}</div>
										<span className="material-icons text-white">
											expand_more
										</span>
									</div>
								}
								variant="big"
							>
								<ul className="rounded-md bg-dank-225 mt-2 py-2 text-sm">
									{(user.isModerator || user.isAdmin) && (
										<Link href="/control">
											<li className="hover:bg-dank-250 w-full px-4 py-1 transition duration-75 ease-in-out">
												Control panel
											</li>
										</Link>
									)}
									<Link href="/appeals">
										<li className="hover:bg-dank-250 w-full px-4 py-1 transition duration-75 ease-in-out">
											Appeal a ban
										</li>
									</Link>
									<Link href="/reports">
										<li className="hover:bg-dank-250 w-full px-4 py-1 transition duration-75 ease-in-out">
											Report a user
										</li>
									</Link>
									<Link href="/api/auth/logout">
										<li className="text-red-400 hover:bg-dank-250 w-full px-4 py-1 transition duration-75 ease-in-out">
											Logout
										</li>
									</Link>
								</ul>
							</Dropdown>
						</div>
					)}
				</div>
				<div
					className="items-center relative flex lg:hidden cursor-pointer select-none"
					onClick={() => setHamburger(!hamburger)}
				>
					<span className="material-icons">menu</span>
				</div>
			</nav>
			{hamburger && (
				<ul className="absolute flex flex-col bg-dank-250 box-border w-screen h-screen z-50 top-[105px]">
					<Link href="/commands">
						<li className="hover:text-dank-50 p-4 border-b-2 border-dank-300">
							Commands
						</li>
					</Link>
					<Link href="/faq">
						<li className="hover:text-dank-50 p-4 border-b-2 border-dank-300">
							FAQ
						</li>
					</Link>
					<Link href="/blogs">
						<li className="hover:text-dank-50 p-4 border-b-2 border-dank-300">
							Blog
						</li>
					</Link>
					<Link href="/items">
						<li className="hover:text-dank-50 p-4 border-b-2 border-dank-300">
							Items
						</li>
					</Link>
					<Link href="/feedback">
						<li className="hover:text-dank-50 p-4 border-b-2 border-dank-300">
							Feedback
						</li>
					</Link>
					<Link href="/appeals">
						<li className="hover:text-dank-50 p-4 border-b-2 border-dank-300">
							Appeal a ban
						</li>
					</Link>
					<Link href="/reports">
						<li className="hover:text-dank-50 p-4 border-b-2 border-dank-300">
							Report a user
						</li>
					</Link>
					{(user?.isModerator || user?.isAdmin) && (
						<Link href="/control">
							<li className="hover:text-dank-50 p-4 border-b-2 border-dank-300">
								Control panel
							</li>
						</Link>
					)}
					{user ? (
						<Link href="/reports">
							<li className="text-red-400 hover:text-red-500 p-4 border-b-2 border-dank-300">
								Logout
							</li>
						</Link>
					) : (
						<Link href="/api/auth/logout">
							<li className="hover:text-dank-50 p-4 border-b-2 border-dank-300">
								Login
							</li>
						</Link>
					)}
				</ul>
			)}
		</div>
	);
}