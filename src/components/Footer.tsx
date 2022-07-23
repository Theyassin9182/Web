import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Link from "./ui/Link";

export default function Footer() {
	const [mounted, setMounted] = useState(false);
	const { theme, setTheme } = useTheme();

	useEffect(() => setMounted(true), []);

	return (
		<footer>
			<div className="bg-light-200 font-inter dark:bg-dark-500">
				<div className="flex justify-center">
					<div className="flex flex-col items-center space-x-0 space-y-4 p-14 lg:flex-row lg:space-x-72 lg:space-y-0">
						<div className="flex items-center space-x-4">
							<Link href="/">
								<img src={"/img/memer.png"} alt="Logo" width="100" height="100" />
							</Link>
							<div className="flex flex-col -space-y-1">
								<h2 className="font-montserrat text-2xl font-bold text-dank-300 dark:text-light-200">
									DANK MEMER
								</h2>
								<span className="text-md text-gray-400">
									Copyright © {new Date().getFullYear()} Dank Memer
								</span>
								<span data-ccpa-link="1"></span>
							</div>
						</div>
						<div className="flex space-x-6 lg:space-x-12">
							<div className="flex flex-col space-y-0">
								<Link href="https://www.patreon.com/join/dankmemerbot" variant="secondary">
									Premium
								</Link>
								<Link href="/commands" variant="secondary">
									Commands
								</Link>
								<Link href="/community/blog" variant="secondary">
									Our blog
								</Link>
							</div>
							<div className="flex flex-col">
								<Link href="/staff" variant="secondary">
									Staff
								</Link>
								<Link href="/terms" variant="secondary">
									Terms
								</Link>
								<Link href="/privacy" variant="secondary">
									Privacy
								</Link>
							</div>
							<div className="flex flex-col">
								<Link href="/rules" variant="secondary">
									Rules
								</Link>
								<Link href="/reports" variant="secondary">
									Reports
								</Link>
								<Link href="/appeals" variant="secondary">
									Appeals
								</Link>
							</div>
							<div className="flex flex-col">
								<Link href="/tutorials" variant="secondary">
									tutorials
								</Link>
								<Link href="/jobs" variant="secondary">
									We're Hiring!
								</Link>
								<Link href="#" variant="secondary">
									{mounted ? (
										<span onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
											{theme === "dark" ? "Light Mode" : "Dark Mode"}
										</span>
									) : (
										<span>Loading...</span>
									)}
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
}
