import clsx from "clsx";
import { GetServerSideProps } from "next";
import { NextSeo } from "next-seo";
import Head from "next/head";
import { PageProps } from "../../types";
import { sanitizeCategory } from "../../util/community";
import { unauthenticatedRoute } from "../../util/redirects";
import { withSession } from "../../util/session";

const postsData = [
	{
		category: "currency_items",
		posts: 368,
		accepted: 7,
	},
	{
		category: "currency_commands",
		posts: 388,
		accepted: 18,
	},
	{
		category: "currency_balances",
		posts: 108,
		accepted: 5,
	},
	{
		category: "new_features",
		posts: 298,
		accepted: 4,
	},
	{
		category: "qol_changes",
		posts: 93,
		accepted: 9,
	},
	{
		category: "patreon_and_lootboxes",
		posts: 31,
		accepted: 2,
	},
	{
		category: "website",
		posts: 7,
		accepted: 1,
	},
	{
		category: "pipe_dream",
		posts: 105,
		accepted: 1,
	},
	{
		category: "other",
		posts: 389,
		accepted: 7,
	},
];

export default function Recap({ user }: PageProps) {
	return (
		<div className="relative h-screen">
			<style
				dangerouslySetInnerHTML={{
					__html: `
					html {
						overflow: scroll;
						overflow-x: hidden;
					}
					::-webkit-scrollbar {
						width: 0;  /* Remove scrollbar space */
						background: transparent;  /* Optional: just make scrollbar invisible */
					}
					/* Optional: show position indicator in red */
					::-webkit-scrollbar-thumb {
						background: #FF0000;
					}
			`,
				}}
			/>

			<NextSeo
				title={`Dank Memer | 2021`}
				openGraph={{
					images: [
						{
							url: "/img/recap/2021/misc/preview.png",
							alt: "Preview",
							type: "image/png",
						},
					],
				}}
			/>
			<Head>
				<meta name="twitter:card" content="summary_large_image" />
			</Head>

			<div className="flex flex-col items-center">
				<img src="/img/recap/2021/blurs/one.png" className="absolute -z-10 h-full w-full" />
				<div className="mt-80 flex space-x-0 lg:space-x-12">
					{Array.from({ length: 5 }, (_, i: number) => 2017 + i).map((year) => (
						<div className="relative hidden lg:inline-block">
							<div className="font-montserrat text-3xl font-semibold text-light-600">{year}</div>
							<img className="absolute top-4 scale-125" src={`/img/recap/2021/misc/${year}-line.png`} />
						</div>
					))}
					<div className="relative">
						<div className="font-montserrat text-3xl font-semibold text-white">2022</div>
						<img className="absolute top-1 scale-150" src={`/img/recap/2021/misc/2022-circle.png`} />
					</div>
				</div>

				<div className="relative mt-14 flex w-full flex-col space-y-4">
					<div className="flex flex-col items-center text-center">
						<div className="font-montserrat text-5xl font-bold text-white lg:text-6xl">DANK MEMER</div>
						<div className="font-montserrat text-2xl font-bold text-neutral-400 lg:text-4xl">
							Community Recap
						</div>
					</div>
					<div className="mx-4 text-center leading-5 text-neutral-300">
						2021 was both an insane and intense year for Dank Memer.
						<br />
						Join us as we look back over what we achieved this year!
					</div>
					<div className="hidden xl:inline-block">
						<img
							className="absolute left-80 -rotate-45 scale-[0.6]"
							src="/img/recap/2021/emojis/pepeDS.gif"
						/>
						<img
							className="absolute right-80 top-10 rotate-[30deg] scale-[0.4]"
							src="/img/recap/2021/emojis/peepoClap.gif"
						/>
						<img
							className="absolute right-80 -top-52 -rotate-[30deg] scale-[0.6]"
							src="/img/recap/2021/emojis/pepoCheer.gif"
						/>
					</div>
				</div>

				<div className="mt-72 font-montserrat text-sm font-bold text-neutral-400">SCROLL FOR THE RECAP</div>

				<div className="mt-52 flex w-8/12 flex-col space-y-4">
					<div className="flex justify-between font-montserrat text-3xl font-bold">
						{"EXPANSION".split("").map((letter) => (
							<div>{letter}</div>
						))}
					</div>

					<div className="text-center text-lg leading-6 text-neutral-300">
						<div>For the second year in a row, we experienced some insane growth for Dank Memer.</div>
						<div>
							Gaining an additional <span className="text-dank-100">3.6 million</span> servers in 2021,
							slingshotting us past the <span className="text-dank-100">8 million</span>
						</div>
						<div>mark by the end of the year!</div>
					</div>
				</div>

				<div className="w-full">
					<img src="/img/recap/2021/blurs/two.png" className="absolute -z-10 h-full w-full" />
					<div className="relative mt-52 flex flex-col items-center space-y-8 text-center">
						<div>
							<div className="font-montserrat text-3xl font-bold">IT IS ALL ABOUT YOU</div>
							<div className="mx-8 text-lg leading-6 text-neutral-300">
								<div>2021 was the year we introduced a massive community feature on our website.</div>
								<div>
									Providing the team an outlet to hear your voice and understand what the community
								</div>
								<div>
									really wants. With this, we found out you wanted to tell us{" "}
									<span className="font-bold">a lot</span>.
								</div>
							</div>
						</div>
						<div className="flex flex-col space-x-0 space-y-6 xl:flex-row xl:space-x-12 xl:space-y-0">
							{[
								[1000, "COMMENTS POSTED"],
								[1700, "POSTS CREATED"],
								[10000, "UPVOTES MADE"],
							].map(([amount, name]) => (
								<div className="w-72 rounded-md bg-dark-100 px-12 py-8">
									<div className="flex flex-col">
										<div className="font-montserrat text-2xl font-bold text-dank-100">
											{amount.toLocaleString()}+
										</div>
										<div className="font-montserrat font-bold">{name}</div>
									</div>
								</div>
							))}
						</div>
						<div className="hidden 2xl:inline-block">
							<img
								className="absolute right-24 -top-10 -rotate-[60deg] scale-[0.6]"
								src="/img/recap/2021/shapes/blue-square.png"
							/>
							<img
								className="absolute right-96 -top-10 -rotate-[120deg]"
								src="/img/recap/2021/shapes/blue-triangle.png"
							/>
							<img className="absolute right-52 top-32" src="/img/recap/2021/shapes/purple-circle.png" />
							<img className="absolute left-96 -top-20" src="/img/recap/2021/shapes/green-circle.png" />
							<img
								className="absolute left-96 top-10 rotate-[60deg] scale-50"
								src="/img/recap/2021/shapes/yellow-pentagon.png"
							/>
							<img className="absolute left-52 top-12" src="/img/recap/2021/shapes/pink-circle.png" />
							<img
								className="absolute left-0 -top-20 rotate-[50deg] scale-110"
								src="/img/recap/2021/shapes/red-triangle.png"
							/>
						</div>
					</div>
				</div>
				<div className="mt-96 flex w-full flex-col space-y-4">
					<div>
						<img className="absolute w-full" src="/img/recap/2021/misc/wavy-lines.png" />
						<img src="/img/recap/2021/blurs/three.png" className="absolute -z-10 h-full w-full" />
					</div>
					<div className="mx-8 text-center">
						<div className="font-montserrat text-3xl font-bold">SEEMS LIKE YOU HAVE SOME FAVOURITES</div>
						<div className="text-neutral-300">
							It is quite obvious that you all like to talk about specific aspects of the bot much
						</div>
						<div className="text-neutral-300">more than others. No hard feelings.</div>
					</div>
					<div className="flex justify-center">
						<div className="mx-4 flex w-full flex-col space-y-4 lg:w-6/12">
							{postsData
								.sort((a, z) => z.posts - a.posts)
								.map((data) => (
									<div className="flex w-full items-center space-x-4">
										<div
											style={{
												width: `${Math.max((data.posts / 400) * 100, 25)}%`,
											}}
											className="relative inline-block h-8 rounded-full bg-dank-200 md:hidden"
										>
											<div className="absolute top-1 right-3">
												{data.posts.toLocaleString()} posts
											</div>
										</div>
										<div
											style={{
												width: `${Math.max((data.posts / 400) * 100, 15)}%`,
											}}
											className="relative hidden h-8 rounded-full bg-dank-200 md:inline-block xl:hidden"
										>
											<div className="absolute top-1 right-3">
												{data.posts.toLocaleString()} posts
											</div>
										</div>
										<div
											style={{
												width: `${Math.max((data.posts / 400) * 100, 12)}%`,
											}}
											className="relative hidden h-8 rounded-full bg-dank-200 xl:inline-block"
										>
											<div className="absolute top-1 right-3">
												{data.posts.toLocaleString()} posts
											</div>
										</div>
										<div className="w-60">{sanitizeCategory(data.category)} </div>
									</div>
								))}
						</div>
					</div>
				</div>

				<div className="mt-96 flex w-full flex-col items-center space-y-8">
					<div className="text-center">
						<div className="font-montserrat text-3xl font-bold">NOT JUST A DISCUSSION</div>
						<div className="text-neutral-300">
							Though it may not seem like it, the feedback provided by our community is very valuable
						</div>
						<div className="text-neutral-300">to the entire team behind Dank Memer.</div>
					</div>
					<div className="flex flex-col md:flex-row">
						<img src="/img/recap/2021/stats/developer-responses.png" className="scale-90" />
						<img src="/img/recap/2021/stats/implemented.png" className="scale-90" />
					</div>
				</div>

				<div className="w-full">
					<img src="/img/recap/2021/blurs/two.png" className="absolute -z-10 h-full w-full" />
					<div className="relative mt-52 flex flex-col items-center space-y-8 text-center">
						<div>
							<div className="mt-20 font-montserrat text-3xl font-bold">DON'T SEND IT ALL AT ONCE</div>
							<div className="px-8 text-lg leading-6 text-neutral-300">
								<div>Along with the increased number of servers that are using Dank Memer,</div>
								<div>everything else have been astounding this year as well!</div>
							</div>
						</div>
						<div className="grid gap-4 xl:grid-cols-3">
							{[
								["9 BILLION", "COMMANDS SENT"],
								["11 TRILLION", "COINS GENERATED"],
								["13 MILLION", "NEW UNIQUE USERS"],
								["53 TRILLION", "WORTH OF ITEMS GENERATED"],
								["+69%", "PATREON REVENUE"],
								["40 THOUSAND", "NEW LINES OF CODE"],
							].map(([amount, name]) => (
								<div className="flex w-72 justify-center rounded-md bg-dark-100 px-12 py-8">
									<div className="flex flex-col justify-center">
										<div className="font-montserrat text-2xl font-bold text-dank-100">{amount}</div>
										<div
											className={clsx(
												"font-montserrat font-bold",
												name.length > 18 ? "text-sm" : "text-md"
											)}
										>
											{name}
										</div>
									</div>
								</div>
							))}
						</div>

						<img
							className="absolute -right-72 -top-40 hidden opacity-25 2xl:inline-block"
							src="/img/recap/2021/shapes/smaller-dotted-circle.png"
						/>
						<img
							className="absolute -left-72 -top-24 hidden scale-[0.9] opacity-25 2xl:inline-block"
							src="/img/recap/2021/shapes/larger-dotted-circle.png"
						/>
					</div>
				</div>

				<div className="mt-96 mb-64 text-center ">
					<div className="font-montserrat text-3xl font-bold text-dank-100">SEE YOU IN 2022!</div>
					<div style={{ fontFamily: "Handlee" }} className="max-w-lg text-xl">
						- Melmsie, Aetheryx, Yeng, InBlue, Bunny, Badosz, Amathine, Kable, Dauntless, Aiphey and
						TheLazyTownie
					</div>
				</div>
			</div>
		</div>
	);
}

export const getServerSideProps: GetServerSideProps = withSession(unauthenticatedRoute);
