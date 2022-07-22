import { useEffect, useState } from "react";
import { Icon as Iconify } from "@iconify/react";
import Tooltip from "src/components/ui/Tooltip";
import axios from "axios";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import Dropdown, { Option } from "src/components/ui/Dropdown";
import clsx from "clsx";
import PagedBanner, { BannerPage, PossibleActions } from "src/components/store/PagedBanner";
import Button from "src/components/ui/Button";
import Switch from "src/components/ui/Switch";
import Input from "src/components/store/Input";
import { Title } from "src/components/Title";
import ControlPanelContainer from "src/components/control/Container";
import ControlLinks from "src/components/control/ControlLinks";
import { PageProps } from "src/types";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { withSession } from "src/util/session";
import GoBack from "src/components/ui/GoBack";
import { Session } from "next-iron-session";

type ActionOption = Option & { action: PossibleActions };

const Options: ActionOption[] = [
	{
		label: "Open a Link",
		action: PossibleActions.OPEN_LINK,
	},
	{
		label: "Add a product to user's cart",
		action: PossibleActions.ADD_TO_CART,
	},
];

export default function BannerEditor({ user, bannerId }: PageProps & { bannerId?: string }) {
	const router = useRouter();
	const [submitInactiveBanner, setSubmitInactiveBanner] = useState(true);
	const [isBannerActive, setIsBannerActive] = useState(false);

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [image, setImage] = useState("");

	const [primaryText, setPrimaryText] = useState("");
	const [primaryAction, setPrimaryAction] = useState<ActionOption>();
	const [primaryInput, setPrimaryInput] = useState("");

	const [secondaryText, setSecondaryText] = useState("");
	const [secondaryAction, setSecondaryAction] = useState<ActionOption>();
	const [secondaryInput, setSecondaryInput] = useState("");

	const [sampleBanner, setSampleBanner] = useState<BannerPage>({
		title,
		description,
		image,
		primaryAction: {
			text: primaryText,
			action: primaryAction ? primaryAction.action : PossibleActions.OPEN_LINK,
			input: primaryInput,
		},
		secondaryAction: {
			text: secondaryText,
			action: secondaryAction ? secondaryAction.action : PossibleActions.OPEN_LINK,
			input: secondaryInput,
		},
	});

	useEffect(() => {
		setSampleBanner({
			title,
			description,
			image,
			primaryAction: {
				text: primaryText,
				action: primaryAction ? primaryAction.action : PossibleActions.OPEN_LINK,
				input: primaryInput,
			},
			secondaryAction: {
				text: secondaryText,
				action: secondaryAction ? secondaryAction.action : PossibleActions.OPEN_LINK,
				input: secondaryInput,
			},
		});
	}, [
		title,
		description,
		image,
		primaryText,
		primaryAction,
		primaryInput,
		secondaryText,
		secondaryAction,
		secondaryInput,
	]);

	useEffect(() => {
		if (bannerId) {
			axios("/api/store/banners/get?id=" + bannerId)
				.then(({ data }: { data: BannerPage }) => {
					setTitle(data.title);
					setDescription(data.description);
					setImage(data.image);
					setPrimaryText(data.primaryAction.text);
					setPrimaryAction(Options.find((option) => option.action === data.primaryAction.action));
					setPrimaryInput(data.primaryAction.input);
					setSecondaryText(data.secondaryAction?.text ?? "");
					setSecondaryAction(Options.find((option) => option.action === data.secondaryAction?.action));
					setSecondaryInput(data.secondaryAction?.input ?? "");
					setIsBannerActive(data.active!);
					setSubmitInactiveBanner(data.active!);
				})
				.catch((e) => {
					console.error(e.message.replace(/"/g, ""));
					toast.error(e.data.response.message);
				});
		}
	}, []);

	const createNew = () => {
		axios({
			url: `/api/store/banners/add`,
			method: "POST",
			data: { ...sampleBanner, active: submitInactiveBanner },
		})
			.then(() => {
				return router.push(`/control/store/banners`);
			})
			.catch((e) => {
				toast.dark(e.response.data.error);
			});
	};

	const submitChanges = () => {
		axios({
			url: `/api/store/banners/update?id=${bannerId}`,
			method: "PATCH",
			data: { ...sampleBanner, active: submitInactiveBanner },
		})
			.then(() => {
				return router.push(`/control/store/banners`);
			})
			.catch((e) => {
				toast.dark(e.response.data.error);
			});
	};

	return (
		<ControlPanelContainer title="Store Banners" links={<ControlLinks user={user!} />}>
			<GoBack />
			<Title size="big">Banner Editor</Title>
			<div className="mt-5 flex flex-col space-y-3">
				<Input
					onChange={(e) => setTitle(e.target.value)}
					type={"text"}
					width="w-full"
					label="Title"
					required
					placeholder="A cool rock"
					value={title}
				/>
				<Input
					onChange={(e) => setDescription(e.target.value)}
					type={"text"}
					width="w-full"
					label="Description"
					required
					placeholder="Check out this really cool rock"
					value={description}
				/>
				<Input
					onChange={(e) => setImage(e.target.value)}
					type={"text"}
					width="w-full"
					label="Image URL"
					required
					placeholder="https://link-to-c.ooo/L/rock.png"
					value={image}
				/>
				<div className="flex w-full space-x-5">
					<div className="flex w-1/2 flex-col space-y-3">
						<Input
							onChange={(e) => setPrimaryText(e.target.value)}
							type={"text"}
							width="w-full"
							label="Primary button text"
							required
							placeholder="Buy this Rock!"
							value={primaryText}
						/>
						<div className="flex w-full items-center justify-between space-x-5">
							<div className="w-1/3">
								<p className="mb-1 text-neutral-600 dark:text-neutral-300">
									Primary action
									<sup className="text-red-500">*</sup>
								</p>
								<Dropdown
									content={
										<div
											className={clsx(
												"flex items-center justify-between",
												"rounded-md border border-[#3C3C3C]",
												"bg-light-500 text-neutral-800 transition-colors dark:bg-black/40 dark:text-neutral-400",
												"w-full px-3 py-2 text-sm"
											)}
										>
											<p>{primaryAction ? primaryAction.label : "Select one"}</p>
											<Iconify icon="ic:baseline-expand-more" height={15} className="ml-1" />
										</div>
									}
									options={Options.map((option) => ({
										label: option.label,
										onClick: () => setPrimaryAction(option),
									}))}
									isInput={false}
									requireScroll={false}
								/>
							</div>
							<div className="w-2/3">
								<Input
									onChange={(e) => setPrimaryInput(e.target.value)}
									type={"text"}
									width="w-full"
									label="Primary action input"
									required
									placeholder="Some kind of input to provide to the function selected"
									value={primaryInput}
								/>
							</div>
						</div>
					</div>
					<div className="flex w-1/2 flex-col space-y-3">
						<Input
							onChange={(e) => setSecondaryText(e.target.value)}
							type={"text"}
							width="w-full"
							label="Secondary button text"
							placeholder="Learn more"
							value={secondaryText}
						/>
						<div className="flex w-full items-center justify-between space-x-5">
							<div className="w-1/3">
								<p className="mb-1 text-neutral-600 dark:text-neutral-300">Secondary action</p>
								<Dropdown
									content={
										<div
											className={clsx(
												"flex items-center justify-between",
												"rounded-md border border-[#3C3C3C]",
												"bg-light-500 text-neutral-800 transition-colors dark:bg-black/40 dark:text-neutral-400",
												"w-full px-3 py-2 text-sm"
											)}
										>
											<p>{secondaryAction ? secondaryAction.label : "Select one"}</p>
											<Iconify icon="ic:baseline-expand-more" height={15} className="ml-1" />
										</div>
									}
									options={Options.map((option) => ({
										label: option.label,
										onClick: () => setSecondaryAction(option),
									}))}
									isInput={false}
									requireScroll={false}
								/>
							</div>
							<div className="w-2/3">
								<Input
									onChange={(e) => setSecondaryInput(e.target.value)}
									type={"text"}
									width="w-full"
									label="Secondary action input"
									placeholder="Some kind of input to provide to the function selected"
									value={secondaryInput}
								/>
							</div>
						</div>
					</div>
				</div>

				<div className="flex items-center justify-end space-x-4">
					<div className="flex items-center justify-end space-x-2 text-red-400">
						<p className="flex items-center space-x-2">
							<span>
								{bannerId ? "Set banner to be" : "Create banner as"}{" "}
								<span className="font-bold">
									{isBannerActive && !submitInactiveBanner ? "inactive" : "active"}
								</span>
							</span>
							<Tooltip
								content={
									<>
										Active banners are visible to customers on the store.
										<br />
										Inactive are hidden but can be managed here.
									</>
								}
							>
								<Iconify icon="ant-design:question-circle-filled" />
							</Tooltip>
						</p>
						<Switch
							checked={submitInactiveBanner}
							variant="normal"
							onClick={() => setSubmitInactiveBanner((curr) => !curr)}
						/>
					</div>
					<Button
						variant="primary"
						onClick={() => {
							if (bannerId) {
								submitChanges();
							} else {
								createNew();
							}
						}}
					>
						{bannerId ? "Submit changes" : "Create new banner"}
					</Button>
				</div>
			</div>
			<div className="mt-5">
				<PagedBanner displayPage={sampleBanner} height={"h-72"} />
			</div>
		</ControlPanelContainer>
	);
}

export const getServerSideProps: GetServerSideProps = withSession(
	async (ctx: GetServerSidePropsContext & { req: { session: Session } }) => {
		const user = await ctx.req.session.get("user");

		if (!user) {
			return {
				redirect: {
					destination: `/api/auth/login?redirect=${encodeURIComponent(ctx.resolvedUrl)}`,
					permanent: false,
				},
			};
		}

		if (!user.developer) {
			return {
				redirect: {
					destination: "/",
					permanent: false,
				},
			};
		}

		if (ctx.query.id) {
			return {
				props: {
					user,
					bannerId: ctx.query.id,
				},
			};
		} else {
			return {
				props: { user },
			};
		}
	}
);
