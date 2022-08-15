import axios from "axios";
import { format } from "date-fns";
import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import SimpleBar from "simplebar-react";
import { Badge } from "src/components/Badge";
import Container from "src/components/control/Container";
import AdjustSubscription, { SubscriptionOption } from "src/components/dashboard/account/modals/AdjustSubscription";
import CancelSubscription from "src/components/dashboard/account/modals/CancelSubscription";
import CreateCard from "src/components/dashboard/account/modals/CreateCard";
import DeleteSelectedCards from "src/components/dashboard/account/modals/DeleteCards";
import SavedPaymentMethods from "src/components/dashboard/account/SavedPaymentMethods";
import DashboardLinks from "src/components/dashboard/DashboardLinks";
import ActiveSubscription from "src/components/dashboard/SubscribedTo";
import Dialog from "src/components/Dialog";
import LoadingPepe from "src/components/LoadingPepe";
import { Title } from "src/components/Title";
import { SensitiveCustomerData } from "src/pages/api/customers/[userId]";
import { SubscriptionInformation } from "src/pages/api/customers/[userId]/subscription";
import { PageProps, Profile } from "src/types";
import { authenticatedRoute } from "src/util/redirects";
import { withSession } from "src/util/session";

export type PossibleDialogViews = "adjust" | "cancel" | "new-card" | "delete-cards";

export default function Account({ user }: Required<PageProps>) {
	const [loading, setLoading] = useState(true);
	const [profile, setProfile] = useState<Profile>();
	const [customer, setCustomer] = useState<SensitiveCustomerData>();
	const [subscribedTo, setSubscribedTo] = useState<SubscriptionInformation>();
	const [availableSubscriptions, setAvailableSubscriptions] = useState<SubscriptionOption[]>([]);

	const [selectedCards, setSelectedCards] = useState<string[]>([]);

	const [dialogOpen, setDialogOpen] = useState(false);
	const [dialogView, setDialogView] = useState<PossibleDialogViews | null>();

	useEffect(() => {
		axios
			.all([
				axios.get(`/api/community/profile/get/${user!.id}`),
				axios.get(`/api/customers/${user!.id}?sensitive=true`),
			])
			.then(
				axios.spread(({ data: profile }, { data: customerData }) => {
					setProfile(profile);
					setCustomer(customerData);
					if (customerData.activeSubscription) {
						axios(`/api/customers/${user!.id}/subscription`)
							.then(({ data: { subscription } }) => {
								setSubscribedTo(subscription);
							})
							.catch((e) => {
								console.error(e);
							});
					}
				})
			)
			.catch(() => {
				toast.error("Failed to load user data. Please try again later.");
			})
			.finally(() => {
				setLoading(false);
			});
	}, []);

	useEffect(() => {
		if (dialogView && dialogView.length >= 1) {
			setDialogOpen(true);
		} else {
			setDialogOpen(false);
		}
	}, [dialogView]);

	useEffect(() => {
		if (!dialogOpen && dialogView && dialogView.length >= 1) {
			setDialogView(null);
		}
	}, [dialogOpen]);

	return (
		<Container customSpacing={true} title="Account" links={<DashboardLinks user={user!} />}>
			{loading || !profile ? (
				<LoadingPepe />
			) : (
				<main>
					{(subscribedTo || user) && (
						<Dialog open={dialogOpen} onClose={setDialogOpen} closeButton>
							{(() => {
								switch (dialogView) {
									case "adjust":
										if (!subscribedTo) return;
										return (
											<AdjustSubscription
												userId={user.id}
												availableSubscriptions={availableSubscriptions}
												onAvailableSubscriptionsChange={setAvailableSubscriptions}
												isOpen={dialogOpen}
												current={{
													id: subscribedTo.product.id,
													name: subscribedTo.product.name,
													image: subscribedTo.product.image,
													price: `$${(subscribedTo.product.price.value / 100).toFixed(2)}`,
													interval: subscribedTo.product.price.interval,
												}}
											/>
										);
									case "cancel":
										if (!subscribedTo) return;
										return (
											<CancelSubscription
												userId={user.id}
												ends={format(
													new Date(subscribedTo.currentPeriod.end * 1000),
													"LLLL do',' yyyy',' 'at' h:mm aaa"
												)}
											/>
										);
									case "new-card":
										return <CreateCard userId={user.id} />;
									case "delete-cards":
										return <DeleteSelectedCards userId={user.id} cardIds={selectedCards} />;
								}
							})()}
						</Dialog>
					)}
					<div
						className="relative h-64 w-full bg-cover bg-center bg-no-repeat dark:bg-dank-500"
						style={{ backgroundImage: `url('${profile.user.banner}')` }}
					>
						<div
							className="absolute -bottom-20 left-8 h-44 w-44 rounded-full border-8 border-white bg-neutral-200 bg-cover bg-center bg-no-repeat dark:border-dark-400 dark:bg-dark-200"
							style={{
								backgroundImage: `url('${profile.user.avatar}?size=512')`,
							}}
						></div>
					</div>
					<div className="ml-56 mt-2">
						<div className="flex items-baseline justify-start">
							<Title size="big">{profile.user.name}</Title>
							<Title size="xsmall" className="font-semibold text-neutral-500 dark:!text-neutral-400">
								#{profile.user.discriminator}
							</Title>
						</div>
						<div>
							{profile.user.developer && <Badge role="developer" />}
							{profile.user.moderator && <Badge role="moderator" />}
							{profile.user.botModerator && <Badge role="botModerator" />}
							{profile.user.modManager && <Badge role="modManager" />}
							{profile.user.honorable && <Badge role="honorable" />}
						</div>
					</div>
					{customer && (
						<SimpleBar className="m-10 lg:max-h-[400px]">
							<section className="flex flex-col items-start justify-start space-y-10 lg:flex-row lg:space-y-0 lg:space-x-32">
								{subscribedTo && (
									<ActiveSubscription subscribedTo={subscribedTo} openView={setDialogView} />
								)}
								<SavedPaymentMethods
									userId={profile.user.id}
									customer={customer}
									onSelectedCardsChange={setSelectedCards}
									openView={setDialogView}
								/>
							</section>
						</SimpleBar>
					)}
				</main>
			)}
		</Container>
	);
}

export const getServerSideProps: GetServerSideProps = withSession(authenticatedRoute);
