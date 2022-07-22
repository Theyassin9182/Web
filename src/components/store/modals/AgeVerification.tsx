import axios, { AxiosError, AxiosResponse } from "axios";
import { isAfter } from "date-fns";
import formatDistanceToNowStrict from "date-fns/formatDistanceToNowStrict";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import { Title } from "src/components/Title";
import Button from "src/components/ui/Button";
import Link from "src/components/ui/Link";
import { STORE_CUSTOM_MIN_AGE } from "src/constants";
import Input from "../Input";

interface Props {
	country: keyof typeof STORE_CUSTOM_MIN_AGE | (string & {});
	age: number;
}

export default function AgeVerification({ age, country }: Props) {
	const router = useRouter();
	const today = useRef(new Date());
	const [userAge, setUserAge] = useState(age);
	const [verifying, setVerifying] = useState(false);
	const [legalAge, setLegalAge] = useState<boolean>(
		age >= (STORE_CUSTOM_MIN_AGE[country as keyof typeof STORE_CUSTOM_MIN_AGE] ?? 18)
	);
	const [date, setDate] = useState("");

	const calculateAge = async (e: MouseEvent) => {
		e.preventDefault();
		setVerifying(true);
		const calculatedAge = parseInt(
			formatDistanceToNowStrict(new Date(date), {
				unit: "year",
				roundingMethod: "floor",
			}).split(" ")[0]
		);
		try {
			const res: AxiosResponse = await axios({
				url: "/api/user/age-verification",
				method: "POST",
				data: {
					age: calculatedAge,
				},
			});
			switch (res.status) {
				case 200:
					setLegalAge(true); // Age is legal
					break;
				case 202: // Age is legal but failed to be added to database
					setLegalAge(true);
					break;
			}
			router.reload();
		} catch (e: unknown) {
			let { response: res } = e as AxiosError;
			if (res) {
				switch (res.status) {
					case 403: // Age is already verified and was successful last time.
						setLegalAge(true);
						break;
					case 406: // Age is not legal.
						setLegalAge(false);
						setUserAge(calculatedAge);
						break;
					case 500: // Age is not legal AND could not be added to database
						setLegalAge(false);
						setUserAge(calculatedAge);
						break;
					default:
						// Unknown error
						setLegalAge(false);
						setUserAge(calculatedAge);
				}
			}
		} finally {
			setVerifying(false);
		}
	};

	if (!legalAge && !userAge) {
		return (
			<>
				<Title size="big">Verify your Age</Title>
				<p className="text-neutral-500 dark:text-neutral-400">
					Before you add this to your cart, we need to verify that you are of legal age to make this purchase.
				</p>
				<div className="my-4">
					<Input
						type="date"
						label="Date of birth"
						width="medium"
						onChange={(e) => {
							if (!isAfter(new Date(e.target.value), today.current)) {
								setDate(e.target.value);
							}
						}}
						max={`${today.current.getFullYear()}-${(today.current.getMonth() + 1).toLocaleString("en-US", {
							minimumIntegerDigits: 2,
							useGrouping: false,
						})}-${today.current.getDate().toLocaleString("en-US", {
							minimumIntegerDigits: 2,
							useGrouping: false,
						})}`}
						min={"1900-01-01"}
						required
					/>
				</div>
				<div className="flex items-center space-x-2">
					<Button
						size="medium"
						variant="primary"
						disabled={date.length !== 10}
						onClick={(e) => calculateAge(e as any as MouseEvent)}
						loading={{
							state: verifying,
							text: "Verifying...",
						}}
					>
						Verify
					</Button>
				</div>
			</>
		);
	} else if (!legalAge && userAge) {
		return (
			<>
				<Title size="big">You are Underage!</Title>
				<p className="text-neutral-500 dark:text-neutral-400">
					You have verified your age and are not of legal age to make a purchase including the selected
					product.
					<br />
					If you made a mistake during this process please{" "}
					<Link variant="primary" href="https://discord.gg/dankmemerbot">
						join our support server
					</Link>{" "}
					for more assistance.
				</p>
			</>
		);
	} else {
		return (
			<>
				<Title size="big">Age verification completed</Title>
				<p className="text-neutral-500 dark:text-neutral-400">
					You have verified your age and may add this product to your cart.
				</p>
			</>
		);
	}
}
