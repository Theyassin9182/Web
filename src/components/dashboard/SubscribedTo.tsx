import clsx from "clsx";
import { format } from "date-fns";
import { SubscriptionInformation } from "src/pages/api/customers/[userId]/subscription";
import { PossibleDialogViews } from "src/pages/dashboard/@me";
import { Title } from "../Title";
import Button from "../ui/Button";
import Link from "../ui/Link";

interface Props {
	subscribedTo: SubscriptionInformation;
	openView: (view: PossibleDialogViews) => void;
}

export default function ActiveSubscription({ subscribedTo, openView }: Props) {
	return (
		<section className="max-w-sm">
			<Title size="medium" className="font-semibold">
				Your Subscription
			</Title>
			<p className="text-neutral-500 dark:text-neutral-400">Manage your active subscription</p>
			<div className="mt-5 flex w-full flex-col">
				<div className="flex items-center justify-start space-x-4">
					<div
						className="h-14 w-14 rounded-md bg-[length:40px_40px] bg-center bg-no-repeat dark:bg-dank-500"
						style={{
							backgroundImage: `url('${subscribedTo.product.image}')`,
						}}
					></div>
					<div>
						<p className="text-black dark:text-white">{subscribedTo.product.name}</p>
						<p className="-mt-1 text-sm text-neutral-700 dark:text-neutral-300">
							${(subscribedTo.product.price.value / 100).toFixed(2)}{" "}
							{subscribedTo.product.price.interval.count === 1 ? (
								<>every {subscribedTo.product.price.interval.period}</>
							) : (
								<>
									every {subscribedTo.product.price.interval?.count}{" "}
									{subscribedTo.product.price.interval.period}s
								</>
							)}
						</p>
					</div>
				</div>
			</div>
			{!subscribedTo.finalPeriod && (
				<div className="mt-2 flex items-center justify-start space-x-3">
					{subscribedTo.provider !== "paypal" && (
						<Button
							size="medium"
							className="w-full"
							onClick={() => openView("adjust")}
							disabled={subscribedTo.finalPeriod}
						>
							Adjust subscription
						</Button>
					)}
					<Button
						size="medium"
						variant="danger"
						className={clsx(subscribedTo.provider === "paypal" ? "w-1/2" : "w-full", "min-w-[186px]")}
						onClick={() => openView("cancel")}
						disabled={subscribedTo.finalPeriod}
						title="You have already requested your subscription be cancelled."
					>
						Cancel subscription
					</Button>
				</div>
			)}
			{subscribedTo.finalPeriod && (
				<>
					<p className={clsx("mt-2 text-xs text-red-400 dark:text-red-400")}>
						Your subscription will end on:{" "}
						<span className="underline">
							{format(
								new Date(subscribedTo.currentPeriod.end * 1000),
								"LLLL do',' yyyy',' 'at' h:mm aaa"
							)}
						</span>
					</p>
					<p className="text-xs text-neutral-500 dark:text-neutral-400">
						If you made a mistake in cancelling your subscription,{" "}
						<Link href="https://discord.gg/dankmemerbot" className="!text-dank-100">
							please contact our support
						</Link>
					</p>
				</>
			)}
			{subscribedTo.provider === "paypal" && (
				<p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
					Due to technical limitations changing your subscription plan while using PayPal is not available. If
					you wish to make changes it is advised to cancel your current subscription and resubscribe to your
					preferred tier and billing interval.
				</p>
			)}
		</section>
	);
}
