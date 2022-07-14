import clsx from "clsx";
import {
	ChangeEventHandler,
	DetailedHTMLProps,
	FocusEventHandler,
	HTMLInputTypeAttribute,
	InputHTMLAttributes,
	ReactNode,
} from "react";
import { Icon as Iconify } from "@iconify/react";

interface InputProps {
	width: keyof typeof inputWidths | (string & {});
	type: Omit<"checkbox", HTMLInputTypeAttribute>;
	placeholder?: string;
	defaultValue?: string;
	value?: string;
	label?: string | ReactNode;
	icon?: string;
	iconSize?: number;
	iconEnd?: "left" | "right";
	iconGap?: string;
	required?: boolean;
	disabled?: boolean;
	className?: string;
	onChange?: ChangeEventHandler<HTMLInputElement>;
	onBlur?: FocusEventHandler<HTMLInputElement>;
}

const inputWidths = {
	"extra-small": "w-14",
	small: "w-20",
	medium: "w-40",
	large: "w-[200px]",
};

type Props = InputProps & DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;

export default function Input({
	width,
	type = "text",
	placeholder,
	defaultValue,
	value,
	label,
	icon,
	iconSize = 24,
	iconEnd = "left",
	iconGap,
	required,
	disabled,
	className,
	onChange,
	onBlur,
	...attributes
}: Props) {
	return (
		<div className="group relative flex flex-col justify-start text-black dark:text-white">
			{label && (
				<label className="mb-1 text-neutral-600 dark:text-neutral-300">
					{label}
					{required && <sup className="text-red-500">*</sup>}
				</label>
			)}
			{icon && (
				<span className={clsx("absolute top-10", iconEnd === "right" ? "right-3" : "left-3")}>
					<Iconify
						icon={icon}
						width={iconSize}
						className={clsx(
							value?.length! >= 1 ? "dark:text-white" : "text-neutral-400",
							"transition-colors duration-75"
						)}
					/>
				</span>
			)}
			<input
				type={type}
				disabled={disabled}
				placeholder={placeholder}
				defaultValue={defaultValue}
				value={value}
				onChange={onChange}
				onBlur={onBlur}
				{...attributes}
				className={clsx(
					inputWidths[width as keyof typeof inputWidths] ?? width,
					className ? className : "",
					icon
						? iconEnd !== "right"
							? iconGap
								? `pl-${iconGap}`
								: "pl-11"
							: iconGap
							? `pr-${iconGap}`
							: "pr-11"
						: "",
					"rounded-md px-3 py-2",
					"bg-white dark:bg-dark-400",
					"border border-neutral-300 dark:border-neutral-700",
					"font-inter text-sm focus-visible:border-dank-300 focus-visible:outline-none"
				)}
			/>
		</div>
	);
}
