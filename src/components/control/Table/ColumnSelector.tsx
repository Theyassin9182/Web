import { TableInstance } from "@tanstack/react-table";
import clsx from "clsx";
import Checkbox from "src/components/ui/Checkbox";
import Dropdown from "src/components/ui/Dropdown";
import { toTitleCase } from "src/util/string";
import { Icon as Iconify } from "@iconify/react";

interface Props {
	instance: TableInstance<any>;
}

export default function ColumnSelector({ instance }: Props) {
	return (
		<div className="">
			<Dropdown
				content={
					<div
						className={clsx(
							"flex items-center justify-between",
							"rounded-md border border-[#3C3C3C]",
							"bg-light-500 text-neutral-700 transition-colors dark:bg-dark-100 dark:text-neutral-400 hover:dark:text-neutral-200",
							"w-44 px-4 py-2 text-sm"
						)}
					>
						<p>Visible columns</p>
						<Iconify icon="ic:baseline-expand-more" height={15} className="ml-1" />
					</div>
				}
				options={instance.getAllLeafColumns().map((column) => {
					return {
						label: (
							<div className="flex items-center justify-start" key={column.id}>
								<Checkbox
									state={column.getIsVisible()}
									style={"fill"}
									className="!mt-0"
									callback={() => column.toggleVisibility()}
								>
									<p className="text-sm text-neutral-100 dark:text-neutral-400">
										{toTitleCase(column.id.replace(/rtl\_/, "").replace(/_/, " "))}
									</p>
								</Checkbox>
							</div>
						),
					};
				})}
				isInput={false}
				requireScroll={false}
			/>
		</div>
	);
}
