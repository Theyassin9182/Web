import clsx from "clsx";
import { Dispatch, SetStateAction } from "react";

export interface Tab {
	name: string;
	disabled?: boolean;
}

interface Props {
	tabs: Tab[];
	active: string;
	changeTab: Dispatch<SetStateAction<string>>;
}

export default function Tabs({ tabs = [], active, changeTab }: Props) {
	return (
		<div className="border-b border-slate-200 text-center text-sm font-medium text-slate-500 dark:border-neutral-700 dark:text-slate-300">
			<ul className="-mb-px flex flex-wrap">
				{tabs.map(({ name, disabled }) =>
					!disabled ? (
						<li className="mr-2 cursor-pointer select-none" onClick={() => changeTab(name)}>
							<p
								className={clsx(
									"inline-block border-b-2 p-4 transition-colors",
									active === name
										? "border-dank-300 text-dank-300 dark:border-dank-300 dark:text-dank-300"
										: "border-transparent hover:border-slate-300 hover:text-neutral-600 dark:hover:text-slate-100"
								)}
							>
								{name}
							</p>
						</li>
					) : (
						<li>
							<p className="inline-block cursor-not-allowed p-4 text-gray-400 dark:text-gray-500">
								{name}
							</p>
						</li>
					)
				)}
			</ul>
		</div>
	);
}
