import axios from "axios";
import { GetServerSideProps } from "next";
import { useEffect, useMemo, useRef, useState } from "react";
import Container from "src/components/control/Container";
import DashboardLinks from "src/components/dashboard/DashboardLinks";
import LoadingPepe from "src/components/LoadingPepe";
import { Title } from "src/components/Title";
import { PageProps } from "src/types";
import { authenticatedRoute } from "src/util/redirects";
import { withSession } from "src/util/session";
import { AggregatedPurchaseRecordPurchases } from "../../api/customers/[userId]/history";
import Input from "src/components/store/Input";
import PurchaseViewer from "src/components/dashboard/account/purchases/PurchaseViewer";
import Table from "src/components/control/Table";
import {
	createTable,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	PaginationState,
	SortingState,
	useTableInstance,
} from "@tanstack/react-table";
import Tooltip from "src/components/ui/Tooltip";
import { Icon as Iconify } from "@iconify/react";
import { formatRelative } from "date-fns";
import { STORE_TAX_PERCENT } from "src/constants";
import Pagination from "src/components/control/Table/Pagination";

export default function PurchaseHistory({ user }: PageProps) {
	const { current: table } = useRef(
		createTable().setRowType<AggregatedPurchaseRecordPurchases>().setOptions({ enableSorting: true })
	);

	const [loading, setLoading] = useState(true);
	const [viewing, setViewing] = useState(false);
	const [viewingPurchase, setViewingPurchase] = useState<AggregatedPurchaseRecordPurchases | undefined>();
	const [purchases, setPurchases] = useState<AggregatedPurchaseRecordPurchases[]>([]);

	const [sorting, setSorting] = useState<SortingState>([]);
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10,
	});
	const columns = useMemo(
		() => [
			table.createDisplayColumn({
				id: "ng_type",
				header: "",
				enableSorting: false,
				cell: ({ row }) => (
					<div className="-ml-3 grid w-full place-items-center">
						{row.original!.type === "single" ? (
							<Tooltip content="Single">
								<Iconify icon="akar-icons:shipping-box-01" className="text-teal-600" height={18} />
							</Tooltip>
						) : (
							<Tooltip content="Subscription">
								<Iconify icon="wpf:recurring-appointment" className="text-green-500" />
							</Tooltip>
						)}
					</div>
				),
				size: 40,
				maxSize: 40,
			}),
			table.createDataColumn("_id", {
				header: "Order ID",
				cell: (id) => (
					<p className="flex items-center justify-start space-x-2">
						<span>{id.getValue()}</span>
						{id.row.original?.isGift ? (
							<Tooltip content={`Gifted to: ${id.row.original?.giftFor}`}>
								<Iconify icon="bxs:gift" height={16} />
							</Tooltip>
						) : (
							""
						)}
						{id.row.original?.refundStatus !== undefined && (
							<Tooltip content={"This purchase has a pending refund request"}>
								<Iconify icon="gridicons:refund" height={16} className="text-red-500" />
							</Tooltip>
						)}
					</p>
				),
				size: 320,
			}),
			table.createDataColumn("purchaseTime", {
				id: "rtl_date",
				header: "Purchase date",
				cell: (date) => <>{formatRelative(new Date(date.getValue()), new Date())}</>,
			}),
			table.createDataColumn("items", {
				id: "rtl_cost",
				header: `Cost (incl. tax) before discounts`,
				cell: (items) => {
					const subtotal = items.getValue().reduce((curr: number, item) => curr + item.price, 0);
					return <>${(subtotal + subtotal * (STORE_TAX_PERCENT / 100)).toFixed(2)}</>;
				},
				sortingFn: (a, b) =>
					a.original!.items.reduce((curr: number, item) => curr + item.price, 0) >
					b.original!.items.reduce((curr: number, item) => curr + item.price, 0)
						? -1
						: b.original!.items.reduce((curr: number, item) => curr - item.price, 0) <
						  a.original!.items.reduce((curr: number, item) => curr - item.price, 0)
						? 1
						: 0,
			}),
			table.createDataColumn("items", {
				id: "rtl_items",
				header: "# of Goods",
				cell: (items) => <>{items.getValue().reduce((prev, curr) => prev + curr.quantity, 0)}</>,
				sortingFn: (a, b) =>
					a.original!.items.reduce((prev, curr) => prev + curr.quantity, 0) >
					b.original!.items.reduce((prev, curr) => prev + curr.quantity, 0)
						? -1
						: b.original!.items.reduce((prev, curr) => prev - curr.quantity, 0) <
						  a.original!.items.reduce((prev, curr) => prev - curr.quantity, 0)
						? 1
						: 0,
			}),
			table.createDisplayColumn({
				id: "ng_actions",
				header: "",
				cell: ({ row }) => (
					<div className="ml-3 grid w-full place-items-center">
						<Iconify
							icon="fluent:expand-up-left-16-filled"
							hFlip={true}
							height={18}
							className="cursor-pointer"
							onClick={() => showPurchase(row.original!)}
						/>
					</div>
				),
				size: 40,
				maxSize: 40,
			}),
		],
		[]
	);

	const instance = useTableInstance(table, {
		data: purchases,
		columns,
		state: {
			sorting,
			pagination,
		},
		onSortingChange: setSorting,
		onPaginationChange: setPagination,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	});

	useEffect(() => {
		axios(`/api/customers/${user!.id}/history`)
			.then(({ data }) => {
				setPurchases(data.history);
			})
			.catch(() => {
				console.error("no history");
			})
			.finally(() => {
				setLoading(false);
			});
	}, []);

	const showPurchase = (purchase: AggregatedPurchaseRecordPurchases) => {
		setViewingPurchase(purchase);
		setViewing(true);
	};

	return (
		<Container
			title="Purchase History"
			links={<DashboardLinks user={user!} />}
			hideRightPane={() => setViewing(false)}
			rightPaneVisible={viewing}
			rightPaneContent={<PurchaseViewer purchase={viewingPurchase!} userId={user!.id} />}
		>
			<main>
				<Title size="big">Purchase history</Title>
				<p className="text-neutral-600 dark:text-neutral-400">
					View and manage all previously purchased goods from our store which are linked to your account.
				</p>
				<div className="flex w-full items-center justify-between space-x-10">
					<div className="order-1 mt-8 grow">
						<Input
							icon="bx:search"
							width="w-full"
							className="!bg-light-500 dark:!bg-dark-100"
							placeholder="Search for an order's ID"
							type={"search"}
							value={(instance.getColumn("_id").getFilterValue() ?? "") as string}
							onChange={(e) => instance.getColumn("_id").setFilterValue(e.target.value)}
						/>
					</div>
				</div>
				<section className="flex flex-col space-y-5">
					{loading ? (
						<LoadingPepe />
					) : purchases.length >= 1 ? (
						<Table instance={instance} />
					) : (
						<p>No purchases made</p>
					)}
					<Pagination instance={instance} />
				</section>
			</main>
		</Container>
	);
}

export const getServerSideProps: GetServerSideProps = withSession(authenticatedRoute);
