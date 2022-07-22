import { Title } from "src/components/Title";
import { Refund } from "src/components/dashboard/account/purchases/PurchaseViewer";
import Link from "src/components/ui/Link";

interface Props {
	refund: Refund;
}

export default function RefundViewer({ refund }: Props) {
	return (
		<>
			<Title size="big">Viewing a Refund</Title>
			<div className="mt-3">
				<Title size="xsmall" className="font-semibold">
					Order ID
				</Title>
				<p className="w-max bg-black/10 py-1 px-2 text-neutral-700 dark:text-neutral-200">
					<code>{refund.order}</code>
				</p>
			</div>
			<div className="mt-4">
				<Title size="xsmall" className="font-semibold">
					Contact methods
				</Title>
				<Link href={`/@${refund.purchasedBy}`} className="!text-dank-300 dark:text-dank-300">
					Community profile
				</Link>
				<Link
					href={`https://discord.com/users/${refund.purchasedBy}`}
					className="!text-dank-300 dark:text-dank-300"
				>
					Discord account
				</Link>
				{refund.emails.length >= 1 &&
					refund.emails.map((email) => (
						<p>
							<Link href={`mailto:${email}`}>{email}</Link>
						</p>
					))}
			</div>
			<div className="mt-4">
				<Title size="xsmall" className="font-semibold">
					Reasoning provided for refund
				</Title>
				<p className="text-neutral-700 dark:text-neutral-200">{refund.content}</p>
			</div>
		</>
	);
}
