import axios from "axios";
import clsx from "clsx";
import { formatDistance } from "date-fns";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Avatar } from "../components/Avatar";
import { Badge } from "../components/Badge";
import { BlogPost } from "../components/community/blog/BlogPost";
import { ViewMore } from "../components/community/blog/ViewMore";
import { PostCard } from "../components/community/PostCard";
import Box from "../components/ui/Box";
import Button from "../components/ui/Button";
import Container from "../components/ui/Container";
import Dropdown from "../components/ui/Dropdown";
import Input from "../components/ui/Input";
import { Activity, PageProps, Profile, User } from "../types";
import { unauthenticatedRoute } from "../util/redirects";
import { withSession } from "../util/session";
import { Session } from "next-iron-session";

function Actions({ user, profile }: { user: User; profile: Profile }) {
	const swap = (role: string) => {
		axios
			.patch(`/api/user/role/?role=${role}&id=${profile.user.id}`)
			.then(({}) => {
				location.reload();
			})
			.catch((e) => {
				toast.dark(e.response.data.error);
			});
	};

	const ban = () => {
		axios
			.patch(`/api/user/ban/?type=Community&id=${profile.user.id}`)
			.then(({}) => {
				location.reload();
			})
			.catch((e) => {
				toast.dark(e.response.data.error);
			});
	};

	const unban = () => {
		axios
			.patch(`/api/user/unban/?type=Community&id=${profile.user.id}`)
			.then(({}) => {
				location.reload();
			})
			.catch((e) => {
				toast.dark(e.response.data.error);
			});
	};

	const purge = () => {
		if (
			confirm(
				"This will remove all of this user's data (posts, comments, upvotes, etc.) from the community page. Are you sure you want to continue?"
			)
		) {
			axios
				.patch(`/api/community/profile/purge/${profile.user.id}`)
				.then(({}) => {
					location.reload();
				})
				.catch((e) => {
					toast.dark(e.response.data.error);
				});
		}
	};

	return (
		<div>
			<Dropdown
				content={
					<Button variant="dark" className="w-48">
						Perform Action
					</Button>
				}
				options={[
					user?.developer
						? {
								label: `${profile.user.developer ? "Remove" : "Add"} Developer`,
								onClick: () => {
									swap("developer");
								},
						  }
						: null,
					user?.modManager
						? {
								label: `${profile.user.moderator ? "Remove" : "Add"} Moderator`,
								onClick: () => {
									swap("moderator");
								},
						  }
						: null,
					user?.developer
						? {
								label: `${profile.user.modManager ? "Remove" : "Add"}  Mod Manager`,
								onClick: () => {
									swap("modManager");
								},
						  }
						: null,
					user?.developer
						? {
								label: `${profile.user.botModerator ? "Remove" : "Add"} Bot Moderator`,
								onClick: () => {
									swap("botModerator");
								},
						  }
						: null,
					user?.developer
						? {
								label: `${profile.user.honorable ? "Remove" : "Add"} Honorable`,
								onClick: () => {
									swap("honorable");
								},
						  }
						: null,
					user?.botModerator
						? {
								label: "Purge user",
								onClick: () => {
									purge();
								},
								variant: "danger",
						  }
						: null,
					{
						label: profile.banned ? "Unban" : "Ban",
						onClick: () => {
							(profile.banned ? unban : ban)();
						},
						variant: "danger",
					},
				]}
			/>
		</div>
	);
}

function ActivityCard({ activity }: { activity: Activity }) {
	let text = "???";
	let icon = "???";
	let link = "???";

	switch (activity.type) {
		case 0:
			text = `Created a post titled '${activity.data.title}'`;
			icon = "post_add";
			link = `/community/post/${activity.data.id}`;
			break;
		case 1:
			text = `Commented on a post titled '${activity.data.postTitle}'`;
			icon = "chat_bubble_outline";
			link = `/community/post/${activity.data.postId}`;
			break;
		case 2:
			text = `Replied to a comment on a post titled '${activity.data.postTitle}'`;
			icon = "reply";
			link = `/community/post/${activity.data.postId}`;
			break;
	}

	return (
		<Link href={link}>
			<a className="rounded-md bg-light-500 p-4 text-sm dark:bg-dark-100">
				<div className="flex items-center space-x-4">
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-light-400 text-black dark:bg-dank-400 dark:text-white">
						<div className="material-icons" style={{ fontSize: "20px" }}>
							{icon}
						</div>
					</div>
					<div className="flex-1 text-sm">
						<div className="break-all text-black dark:text-white">{text}</div>
						<div className="text-light-600">
							{formatDistance(new Date(activity.createdAt), new Date(), {
								addSuffix: true,
							})}
						</div>
					</div>
				</div>
			</a>
		</Link>
	);
}

export default function ProfilePage({ user }: PageProps) {
	const [profile, setProfile] = useState<Profile>();
	const [rank, setRank] = useState(0);
	const [editing, setEditing] = useState(false);

	const router = useRouter();

	useEffect(() => {
		// Just in case, should never run
		if (!(router.query.id as string).startsWith("@")) {
			location.replace("/404");
		}
	}, []);

	let id = (router.query.id as string)?.slice(1);

	useEffect(() => {
		axios(`/api/community/profile/get/${id}`)
			.then(({ data }) => {
				setProfile(data);
				if (data.user.vanity) {
					router.replace(`/@${data.user.vanity}`);
				}

				axios(`/api/community/contributors/place/${data.user.id}`).then(({ data }) => {
					setRank(data.place);
				});
			})
			.catch(() => {
				router.push("/community/");
			});
	}, []);

	const updateProfile = () => {
		axios
			.patch(`/api/user/update/`, {
				data: profile!.user,
			})
			.then(({}) => {
				router.replace(`/@${profile!.user.vanity || profile!.user.id}`);
				toast.dark("Saved!");
			})
			.catch((e) => {
				toast.dark(e.response.data.error);
			});
	};

	const switchPerks = () => {
		axios
			.patch(`/api/user/perks?id=${profile?.user.id}`)
			.then(({}) => {
				const copy = { ...profile } as Profile;
				copy.user.perks = !!!profile!.user.perks;
				setProfile(copy);
				toast.dark("Saved!");
			})
			.catch((e) => {
				toast.dark(e.response.data.error);
			});
	};

	return (
		<Container title="Profile" user={user}>
			<div className="my-8 flex flex-col space-y-4">
				{profile && (
					<div className="flex flex-col space-y-2">
						<div className="relative flex h-auto flex-col justify-end">
							<div
								className={clsx(
									"-z-10 w-full rounded-lg bg-cover bg-center bg-no-repeat bg-blend-multiply",
									profile.user.banner ? "h-56" : "h-32"
								)}
								style={{
									backgroundImage: `url("${profile.user.banner || "/img/banner.png"}")`,
								}}
							></div>
						</div>

						<div className="flex flex-col space-y-8 px-8">
							<div className="flex justify-between">
								<div className="relative flex items-center space-x-2">
									<div className="w-[120px]">
										<div className="absolute -top-16 hidden md:inline-block">
											<Avatar
												id={profile.user.id}
												link={profile.user.avatar + "?size=512"}
												size="120px"
												className="rounded-full border-4 border-light-500 dark:border-dark-400"
											/>
										</div>
										<div className="inline-block md:hidden">
											<Avatar
												id={profile.user.id}
												link={profile.user.avatar + "?size=512"}
												size="96px"
												className="rounded-full border-4 border-light-500 dark:border-dark-400"
											/>
										</div>
									</div>
									<div className="flex flex-col">
										<div className="flex items-baseline">
											<div className="text-2xl font-bold text-black dark:text-white">
												{profile.user.name}
											</div>
											<div className="text-sm font-bold text-light-600">
												#{profile.user.discriminator}
											</div>
										</div>
										<div className="flex flex-col space-x-1 space-y-1 md:flex-row md:items-center">
											{rank != -1 && (
												<div className="flex md:inline-block">
													<div className="rounded-md bg-light-500 px-2 py-0.5 text-xs text-dank-200 dark:bg-dank-500 dark:text-dank-100">
														Rank #{rank.toLocaleString()}
													</div>
												</div>
											)}
											<div>
												{profile.user.developer && <Badge role="developer" />}
												{profile.user.moderator && <Badge role="moderator" />}
												{profile.user.botModerator && <Badge role="botModerator" />}
												{profile.user.modManager && <Badge role="modManager" />}
												{profile.user.honorable && <Badge role="honorable" />}
											</div>
										</div>
									</div>
								</div>
								<div className="hidden items-center space-x-4 md:flex">
									{(user?.moderator || user?.honorable || user?.perks) &&
										(user.id == profile.user.id || user.developer) && (
											<Button variant="dark" onClick={() => setEditing(!editing)}>
												Edit Profile
											</Button>
										)}

									{user?.moderator && <Actions user={user!} profile={profile} />}

									{user?.moderator && (
										<Button variant="dark" onClick={() => switchPerks()}>
											{profile.user.perks ? "Remove" : "Grant"} Perks
										</Button>
									)}
								</div>
							</div>

							{editing && (
								<div className="flex flex-col space-y-2 rounded-md bg-light-500 p-4 dark:bg-dark-100">
									<Input
										onChange={(e) => {
											const copy = { ...profile };
											copy.user.vanity = e.target.value;
											setProfile(copy);
										}}
										variant="short"
										placeholder="dankmemer"
										label="Vanity"
										value={profile.user.vanity || ""}
									/>
									<Input
										onChange={(e) => {
											const copy = { ...profile };
											copy.user.banner = e.target.value;
											setProfile(copy);
										}}
										variant="short"
										label="Banner URL"
										placeholder="https://imgur.com/nVqkxS0.png"
										value={profile.user.banner || ""}
									/>
									{user?.developer && profile.user.developer && (
										<Input
											onChange={(e) => {
												const copy = { ...profile };
												copy.user.position = e.target.value;
												setProfile(copy);
											}}
											variant="short"
											label="Position"
											placeholder="CEO"
											value={profile.user.position || ""}
										/>
									)}
									{(user?.moderator || user?.honorable) && (
										<>
											<Input
												onChange={(e) => {
													const copy = { ...profile };
													copy.user.about = e.target.value;
													setProfile(copy);
												}}
												variant="short"
												label="About"
												placeholder="I love dank memer"
												value={profile.user.about || ""}
											/>

											<div className="text-sm text-black dark:text-white">Socials</div>
											{[
												"Discord",
												"GitHub",
												"GitLab",
												"Instagram",
												"Reddit",
												"Spotify",
												"Twitch",
												"Twitter",
												"Website",
												"YouTube",
											].map((social) => (
												<div className="flex items-center space-x-2">
													<div>
														<img src={`/img/socials/${social}.svg`} className="w-8" />
													</div>
													<Input
														onChange={(e) => {
															const copy = {
																...profile,
															};
															if (!copy.user.socials) {
																copy.user.socials = {};
															}
															copy.user.socials[social] = e.target.value;
															setProfile(copy);
														}}
														variant="short"
														block
														placeholder="https://dankmemer.lol/"
														value={profile.user.socials?.[social] || ""}
													/>
												</div>
											))}
										</>
									)}
									<Button variant="primary" onClick={() => updateProfile()}>
										Save
									</Button>
								</div>
							)}

							<Box
								size="md"
								className="flex flex-col justify-between space-y-2 px-8 md:flex-row md:space-y-0"
							>
								{[
									[profile.posts.length, `Post?s made`],
									[profile.comments, "Comment?s made"],
									[profile.upvotes, "Upvote?s given"],
									[profile.posts.reduce((acc, cur) => acc + cur.upvotes, 0), "Upvote?s received"],
									[0, "Award?s received"],
								].map(([count, title]) => (
									<div className="flex flex-col items-center -space-y-1">
										<div className="text-lg font-bold text-black dark:text-white">{count}</div>
										<div className="text-center text-sm text-light-600">
											{(title as string).replace(/\?s/g, count == 1 ? "" : "s")}
										</div>
									</div>
								))}
							</Box>

							{profile.blogs.length > 0 && (
								<div className="relative flex flex-col space-y-2">
									<div>Recent Blogs</div>
									<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
										{profile.blogs.map((blog) => (
											<BlogPost data={blog} user={user} />
										))}
										<ViewMore />
									</div>
								</div>
							)}

							<div className="flex flex-col justify-between space-x-0 space-y-4 md:flex-row md:space-x-4 md:space-y-0">
								<div className="relative flex flex-1 flex-col space-y-2 break-all md:w-3/5">
									{profile.posts.length > 0 && (
										<>
											<div>Recent Posts</div>
											<div className="flex flex-col space-y-2">
												{profile.posts.map((post) => (
													<PostCard data={post} />
												))}
											</div>
										</>
									)}
								</div>
								<div className="flex w-full flex-col space-y-2 md:w-4/12">
									{profile.activities.length > 0 && (
										<>
											<div>Recent Activity</div>
											<div className="flex flex-col space-y-2">
												{profile.activities.map((activity) => (
													<ActivityCard activity={activity} />
												))}
											</div>
										</>
									)}
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</Container>
	);
}

export const getServerSideProps: GetServerSideProps = withSession(
	(ctx: GetServerSidePropsContext & { req: { session: Session } }) => {
		if (!(ctx.query?.id as string)?.startsWith("@")) {
			return {
				redirect: {
					destination: `/404`,
					permanent: true,
				},
			};
		}
		return unauthenticatedRoute(ctx);
	}
);
