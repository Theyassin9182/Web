import clsx from "clsx";
import { formatRelative } from "date-fns";
import { BannerCreator, BannerPage } from "src/components/store/PagedBanner";
import Button from "src/components/ui/Button";
import Link from "src/components/ui/Link";
import Tooltip from "src/components/ui/Tooltip";
import { Icon as Iconify } from "@iconify/react";
import { useRouter } from "next/router";

interface Props {
	banner: BannerPage;
}

export default function CreatedBannerCard({ banner }: Props) {
	const router = useRouter();

	return (
		<div className="relative h-96 w-72 max-w-xs overflow-y-hidden rounded-lg bg-light-500 dark:bg-dank-500">
			<div className="h-32 w-full">
				<div
					className={clsx(
						"left-0 top-0 -z-10 h-32 min-h-full w-full bg-black/30 bg-cover bg-center bg-no-repeat bg-blend-multiply",
						(!banner.image || banner.image.length == 0) && "bg-light-500 dark:bg-dark-100"
					)}
					style={{
						backgroundImage: `url("${banner.image}")`,
						filter: "url(#sharpBlur)",
					}}
				/>
			</div>
			<div className="px-5 py-4">
				<h3 className="flex items-center text-2xl font-bold text-neutral-800 dark:text-white">
					{banner.title}{" "}
					{banner.active ? (
						<div className="ml-2 flex">
							<Tooltip content={<p className="font-inter font-normal">Visible to users</p>}>
								<span className="text-green-500">
									<Iconify icon="ant-design:eye-filled" />
								</span>
							</Tooltip>
						</div>
					) : (
						<div className="ml-2 flex">
							<Tooltip content={<p className="font-inter font-normal">Hidden from users</p>}>
								<span className="text-red-500">
									<Iconify icon="ant-design:eye-invisible-filled" />
								</span>
							</Tooltip>
						</div>
					)}
				</h3>
				<div className="text-sm text-neutral-700 dark:text-white">
					<p>
						Created by:{" "}
						{typeof banner.createdBy === "string" ? (
							<Link className="hover:underline" href={"https://discord.com/users/" + banner.createdBy}>
								{banner.createdBy}
							</Link>
						) : (
							<Link
								className="hover:underline"
								href={"https://discord.com/users/" + (banner.createdBy as BannerCreator).id}
							>
								{(banner.createdBy as BannerCreator).username}#
								{(banner.createdBy as BannerCreator).discriminator}
							</Link>
						)}
					</p>
					{banner.createdAt && <p>Created at: {formatRelative(new Date(banner.createdAt), new Date())}</p>}
					{banner.updatedBy &&
						(typeof banner.updatedBy === "string" ? banner.updatedBy === banner.createdBy : true) && (
							<p>
								Updated by:{" "}
								{typeof banner.updatedBy === "string" ? (
									<Link
										className="hover:underline"
										href={"https://discord.com/users/" + banner.updatedBy}
									>
										{banner.updatedBy}
									</Link>
								) : (
									<Link
										className="hover:underline"
										href={"https://discord.com/users/" + (banner.updatedBy as BannerCreator).id}
									>
										{(banner.updatedBy as BannerCreator).username}#
										{(banner.updatedBy as BannerCreator).discriminator}
									</Link>
								)}
							</p>
						)}
					{banner.lastUpdated && (
						<p>Last updated: {formatRelative(new Date(banner.lastUpdated), new Date())}</p>
					)}
					<p className="mt-2 text-neutral-500 dark:text-neutral-400">{banner.description}</p>
				</div>
			</div>
			<div className="absolute bottom-4 w-full px-5">
				<Button
					size="medium"
					className="w-full"
					onClick={() => router.push("/control/store/banners/editor?id=" + banner._id!)}
				>
					Manage this Banner
				</Button>
			</div>
		</div>
	);
}
