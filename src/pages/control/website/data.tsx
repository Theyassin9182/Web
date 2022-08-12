import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import ControlPanelContainer from "src/components/control/Container";
import ControlLinks from "src/components/control/ControlLinks";
import Expandable from "src/components/Expandable";
import Input from "src/components/store/Input";
import { Title } from "src/components/Title";
import Button from "src/components/ui/Button";
import Tabs, { Tab } from "src/components/ui/Tabs";
import { CommandResource } from "src/pages/api/website/static/content/commands";
import { PageProps } from "src/types";
import { fetcher } from "src/util/hooks/useCart";
import { moderatorRoute } from "src/util/redirects";
import { withSession } from "src/util/session";
import useSWR from "swr";

const TabData: Tab[] = [
	{
		name: "Commands",
	},
	{
		name: "Questions",
	},
	{
		name: "Items",
	},
];

export default function WebsiteOverview({ user }: PageProps) {
	const [view, setView] = useState(<CommandsSection />);
	const [activeTab, setActiveTab] = useState("Commands");

	useEffect(() => {
		switch (activeTab) {
			case "Commands":
				setView(<CommandsSection />);
				break;
			default:
				setView(<></>);
				break;
		}
	}, [activeTab]);

	return (
		<ControlPanelContainer title="Website Overview" links={<ControlLinks user={user!} />}>
			<main>
				<Title size="big">Update static content</Title>
				<Tabs tabs={TabData} active={activeTab} changeTab={setActiveTab} />
				<div className="my-3">{view}</div>
			</main>
		</ControlPanelContainer>
	);
}

function CommandsSection() {
	const { data, isValidating } = useSWR<CommandResource[]>("/api/website/static/content/commands", fetcher);
	const [visibleCommands, setVisibleCommands] = useState(data);
	const [activeCategory, setActiveCategory] = useState("all");
	const [search, setSearch] = useState("");

	const categories: string[] = [];
	data?.map((command) => {
		if (!categories.includes(command.category)) {
			categories.push(command.category);
		}
	});

	useEffect(() => {
		if (search.length >= 1) {
			setVisibleCommands(
				data?.filter(
					(command) =>
						command.name.includes(search.toLowerCase()) ||
						command.usage.includes(search.toLowerCase()) ||
						command.description.includes(search.toLowerCase()) ||
						command.aliases.some((x) => x.includes(search.toLowerCase()))
				)
			);
		} else {
			setVisibleCommands(
				activeCategory === "all" ? data : data?.filter((command) => command.category === activeCategory)
			);
		}
	}, [data, activeCategory, search]);

	return (
		<section>
			<div className="mb-10 flex w-full items-center justify-between space-x-10">
				<div className="order-1 mt-5 grow">
					<Input
						icon="bx:search"
						width="w-full"
						className="!bg-light-500 dark:!bg-dark-100"
						placeholder="Search for a product name"
						type={"search"}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>
				<div className="order-2 mt-5 flex items-center justify-center space-x-4">
					<Button variant="primary" className="w-max" onClick={() => alert("uplod")}>
						Upload new data
					</Button>
				</div>
			</div>
			<div className="flex space-x-10">
				<aside className="mb-3 w-full" style={{ maxWidth: "160px" }}>
					<p>Select a category</p>
					<div className="mt-2 flex flex-col space-y-1">
						<p
							className="cursor-pointer select-none rounded-lg py-1.5 px-4 dark:bg-dark-300"
							onClick={() => setActiveCategory("all")}
						>
							All categories
						</p>
						{categories.map((cat) => (
							<p
								key={cat}
								className="cursor-pointer select-none rounded-lg py-1.5 px-4 dark:bg-dark-300"
								onClick={() => setActiveCategory(cat)}
							>
								{cat}
							</p>
						))}
					</div>
				</aside>
				<div className="flex w-full flex-col space-y-4">
					{visibleCommands?.map((command) => (
						<Expandable
							key={command.name}
							name={command.name}
							description={command.description}
							fields={{
								Aliases: command.aliases.join(", "),
								Usage: command.usage,
								Permissions: command.permissions
									.map((permission) =>
										permission
											.replace(/([A-Z])/g, " $1")
											.split(" ")
											.map((a) => a[0].toUpperCase() + a.substring(1).toLowerCase())
											.join(" ")
									)
									.join(", "),
							}}
						/>
					))}
				</div>
			</div>
		</section>
	);
}

export const getServerSideProps: GetServerSideProps = withSession(moderatorRoute);
