import MastercardLogo from "./Mastercard.svg";
import VisaLogo from "./Visa.svg";

interface Props {
	brand: string;
}

export default function Card({ brand, ...props }: Props) {
	return (
		<svg
			width="207"
			height="131"
			viewBox="0 0 207 131"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<path
				d="M206.785 12.3675L206.84 118.528C206.846 125.353 201.304 130.895 194.473 130.901L12.4353 131C11.2998 131 10.1951 130.846 9.15217 130.556C3.91266 129.124 0.0617191 124.335 0.0555477 118.639L5.15501e-06 12.4786C-0.00616623 5.65304 5.52956 0.104968 12.3675 0.104968L194.411 0.00622559C196.849 0.00622559 199.138 0.715934 201.051 1.95021C204.501 4.13488 206.785 7.97966 206.785 12.3675Z"
				fill="url(#paint0_linear_960_2034)"
			/>
			<path
				opacity="0.53"
				d="M143.374 130.932L12.4353 131C11.2997 131 10.1951 130.846 9.1521 130.556L67.2372 72.4088C68.9713 70.6685 71.0881 69.5453 73.316 69.0701C77.3027 68.1691 81.6659 69.2799 84.7763 72.4027L143.374 130.932Z"
				fill="url(#paint1_linear_960_2034)"
			/>
			<path
				opacity="0.53"
				d="M56.7459 47.3901L0.049375 104.148L5.14928e-06 12.4848C-0.00616624 5.65306 5.53574 0.11116 12.3613 0.104989L26.9566 0.0988159L56.7397 29.8511C61.5904 34.6833 61.5966 42.5456 56.7459 47.3901Z"
				fill="url(#paint2_linear_960_2034)"
			/>
			<path
				opacity="0.53"
				d="M107.197 0.0493164L89.3926 17.8784C84.5543 22.7292 76.6919 22.7353 71.8535 17.8908L54.0244 0.0801729L107.197 0.0493164Z"
				fill="url(#paint3_linear_960_2034)"
			/>
			<path
				opacity="0.53"
				d="M206.785 12.3675L206.834 107.178C203.508 107.308 200.132 106.111 197.589 103.562L122.268 28.3205C117.417 23.4821 117.411 15.6136 122.255 10.7691L132.981 0.0308565L194.405 0C196.843 0 199.132 0.70971 201.045 1.94399C204.501 4.13483 206.785 7.9796 206.785 12.3675Z"
				fill="url(#paint4_linear_960_2034)"
			/>
			<path
				d="M19.0994 30H16.0387V20.5455H19.1964C20.1228 20.5455 20.9183 20.7347 21.5831 21.1133C22.2479 21.4888 22.7572 22.0289 23.1112 22.7337C23.4682 23.4354 23.6467 24.2771 23.6467 25.2589C23.6467 26.2437 23.4666 27.0901 23.1065 27.7979C22.7495 28.5058 22.2325 29.0505 21.5554 29.4322C20.8783 29.8107 20.0597 30 19.0994 30ZM17.4652 28.7536H19.021C19.7411 28.7536 20.3397 28.6181 20.8168 28.3473C21.2938 28.0734 21.6508 27.6779 21.8878 27.1609C22.1248 26.6407 22.2433 26.0067 22.2433 25.2589C22.2433 24.5172 22.1248 23.8878 21.8878 23.3707C21.6539 22.8537 21.3046 22.4613 20.8398 22.1935C20.3751 21.9258 19.7981 21.7919 19.1087 21.7919H17.4652V28.7536ZM27.1523 30.157C26.703 30.157 26.2967 30.0739 25.9336 29.9077C25.5704 29.7384 25.2826 29.4937 25.0703 29.1737C24.861 28.8536 24.7564 28.4612 24.7564 27.9964C24.7564 27.5964 24.8333 27.267 24.9872 27.0085C25.1411 26.75 25.3488 26.5453 25.6104 26.3945C25.872 26.2437 26.1644 26.1299 26.4875 26.0529C26.8107 25.976 27.14 25.9175 27.4755 25.8775C27.9002 25.8282 28.2449 25.7882 28.5096 25.7575C28.7742 25.7236 28.9666 25.6697 29.0866 25.5959C29.2066 25.522 29.2667 25.402 29.2667 25.2358V25.2035C29.2667 24.8003 29.1528 24.4879 28.925 24.2663C28.7004 24.0447 28.3649 23.9339 27.9186 23.9339C27.4539 23.9339 27.0877 24.037 26.8199 24.2433C26.5552 24.4464 26.3721 24.6726 26.2706 24.9219L24.9733 24.6264C25.1272 24.1955 25.3519 23.8478 25.6473 23.5831C25.9459 23.3153 26.289 23.1214 26.6768 23.0014C27.0646 22.8783 27.4724 22.8168 27.9002 22.8168C28.1833 22.8168 28.4834 22.8506 28.8004 22.9183C29.1205 22.983 29.419 23.103 29.696 23.2784C29.9761 23.4538 30.2053 23.7047 30.3838 24.0309C30.5624 24.354 30.6516 24.7741 30.6516 25.2912V30H29.3036V29.0305H29.2482C29.1589 29.209 29.0251 29.3845 28.8466 29.5568C28.6681 29.7292 28.4388 29.8723 28.1587 29.9862C27.8786 30.1 27.5432 30.157 27.1523 30.157ZM27.4524 29.049C27.834 29.049 28.1602 28.9736 28.4311 28.8228C28.705 28.672 28.9127 28.475 29.0543 28.2319C29.199 27.9857 29.2713 27.7225 29.2713 27.4425V26.5284C29.222 26.5777 29.1266 26.6238 28.9851 26.6669C28.8466 26.7069 28.6881 26.7423 28.5096 26.7731C28.3311 26.8008 28.1572 26.8269 27.9879 26.8516C27.8186 26.8731 27.6771 26.8916 27.5632 26.907C27.2954 26.9408 27.0508 26.9978 26.8292 27.0778C26.6106 27.1578 26.4352 27.2732 26.3029 27.424C26.1736 27.5717 26.109 27.7687 26.109 28.0149C26.109 28.3565 26.2352 28.6151 26.4875 28.7905C26.7399 28.9628 27.0615 29.049 27.4524 29.049ZM33.6494 25.7898V30H32.2691V22.9091H33.594V24.0632H33.6818C33.8449 23.6877 34.1003 23.3861 34.4481 23.1584C34.7989 22.9306 35.2406 22.8168 35.773 22.8168C36.2562 22.8168 36.6794 22.9183 37.0426 23.1214C37.4057 23.3215 37.6873 23.62 37.8874 24.017C38.0874 24.4141 38.1874 24.9049 38.1874 25.4897V30H36.8071V25.6559C36.8071 25.1419 36.6732 24.7403 36.4055 24.451C36.1377 24.1586 35.7699 24.0124 35.3021 24.0124C34.9821 24.0124 34.6974 24.0817 34.4481 24.2202C34.2019 24.3587 34.0064 24.5618 33.8618 24.8295C33.7202 25.0942 33.6494 25.4143 33.6494 25.7898ZM41.0872 27.5948L41.0779 25.9098H41.318L44.1433 22.9091H45.796L42.5737 26.3253H42.3567L41.0872 27.5948ZM39.8176 30V20.5455H41.198V30H39.8176ZM44.2956 30L41.7566 26.63L42.7076 25.6651L45.9899 30H44.2956ZM50.1632 20.5455H51.8944L54.9043 27.8949H55.0151L58.0251 20.5455H59.7562V30H58.399V23.1584H58.3113L55.5229 29.9862H54.3965L51.6082 23.1538H51.5204V30H50.1632V20.5455ZM64.5545 30.1431C63.8559 30.1431 63.2542 29.9938 62.7495 29.6953C62.2478 29.3937 61.86 28.9705 61.5861 28.4258C61.3153 27.878 61.1799 27.2363 61.1799 26.5007C61.1799 25.7744 61.3153 25.1342 61.5861 24.5803C61.86 24.0263 62.2416 23.5939 62.731 23.283C63.2234 22.9722 63.7989 22.8168 64.4576 22.8168C64.8577 22.8168 65.2454 22.8829 65.6209 23.0153C65.9964 23.1476 66.3334 23.3554 66.6319 23.6385C66.9305 23.9216 67.1659 24.2894 67.3382 24.7418C67.5106 25.1912 67.5968 25.7375 67.5968 26.3807V26.87H61.96V25.8359H66.2441C66.2441 25.4728 66.1703 25.1512 66.0225 24.8711C65.8748 24.5879 65.6671 24.3648 65.3993 24.2017C65.1346 24.0386 64.8238 23.957 64.4668 23.957C64.079 23.957 63.7405 24.0524 63.4512 24.2433C63.1649 24.431 62.9434 24.6772 62.7864 24.9819C62.6325 25.2835 62.5556 25.6113 62.5556 25.9652V26.7731C62.5556 27.247 62.6387 27.6502 62.8049 27.9826C62.9741 28.315 63.2096 28.5689 63.5112 28.7443C63.8128 28.9167 64.1652 29.0028 64.5684 29.0028C64.83 29.0028 65.0685 28.9659 65.2839 28.892C65.4993 28.8151 65.6855 28.7012 65.8425 28.5504C65.9995 28.3996 66.1195 28.2134 66.2026 27.9918L67.509 28.2273C67.4044 28.612 67.2167 28.949 66.9458 29.2383C66.6781 29.5245 66.3411 29.7476 65.9348 29.9077C65.5317 30.0646 65.0715 30.1431 64.5545 30.1431ZM68.9073 30V22.9091H70.2322V24.0632H70.3199C70.4676 23.6723 70.7092 23.3677 71.0447 23.1491C71.3802 22.9276 71.7818 22.8168 72.2496 22.8168C72.7236 22.8168 73.1206 22.9276 73.4407 23.1491C73.7638 23.3707 74.0023 23.6754 74.1562 24.0632H74.2301C74.3993 23.6847 74.6686 23.383 75.038 23.1584C75.4073 22.9306 75.8474 22.8168 76.3583 22.8168C77.0015 22.8168 77.5262 23.0183 77.9325 23.4215C78.3418 23.8247 78.5465 24.4325 78.5465 25.245V30H77.1662V25.3743C77.1662 24.8942 77.0354 24.5464 76.7738 24.331C76.5122 24.1155 76.1998 24.0078 75.8366 24.0078C75.3873 24.0078 75.038 24.1463 74.7887 24.4233C74.5394 24.6972 74.4147 25.0496 74.4147 25.4805V30H73.039V25.2866C73.039 24.9019 72.919 24.5926 72.6789 24.3587C72.4389 24.1248 72.1265 24.0078 71.7418 24.0078C71.4802 24.0078 71.2386 24.0771 71.017 24.2156C70.7985 24.351 70.6215 24.5402 70.4861 24.7834C70.3538 25.0265 70.2876 25.3081 70.2876 25.6282V30H68.9073ZM83.2316 30.1431C82.533 30.1431 81.9313 29.9938 81.4266 29.6953C80.9249 29.3937 80.5372 28.9705 80.2633 28.4258C79.9924 27.878 79.857 27.2363 79.857 26.5007C79.857 25.7744 79.9924 25.1342 80.2633 24.5803C80.5372 24.0263 80.9188 23.5939 81.4081 23.283C81.9006 22.9722 82.4761 22.8168 83.1347 22.8168C83.5348 22.8168 83.9226 22.8829 84.2981 23.0153C84.6735 23.1476 85.0105 23.3554 85.3091 23.6385C85.6076 23.9216 85.843 24.2894 86.0154 24.7418C86.1877 25.1912 86.2739 25.7375 86.2739 26.3807V26.87H80.6372V25.8359H84.9213C84.9213 25.4728 84.8474 25.1512 84.6997 24.8711C84.552 24.5879 84.3442 24.3648 84.0765 24.2017C83.8118 24.0386 83.5009 23.957 83.1439 23.957C82.7561 23.957 82.4176 24.0524 82.1283 24.2433C81.8421 24.431 81.6205 24.6772 81.4635 24.9819C81.3097 25.2835 81.2327 25.6113 81.2327 25.9652V26.7731C81.2327 27.247 81.3158 27.6502 81.482 27.9826C81.6513 28.315 81.8867 28.5689 82.1883 28.7443C82.4899 28.9167 82.8423 29.0028 83.2455 29.0028C83.5071 29.0028 83.7456 28.9659 83.9611 28.892C84.1765 28.8151 84.3627 28.7012 84.5196 28.5504C84.6766 28.3996 84.7966 28.2134 84.8797 27.9918L86.1862 28.2273C86.0816 28.612 85.8938 28.949 85.623 29.2383C85.3552 29.5245 85.0182 29.7476 84.612 29.9077C84.2088 30.0646 83.7487 30.1431 83.2316 30.1431ZM87.5844 30V22.9091H88.9186V24.0355H88.9924C89.1217 23.6539 89.3495 23.3538 89.6757 23.1353C90.005 22.9137 90.3774 22.8029 90.7929 22.8029C90.879 22.8029 90.9806 22.806 91.0976 22.8121C91.2176 22.8183 91.3115 22.826 91.3792 22.8352V24.1555C91.3238 24.1402 91.2253 24.1232 91.0837 24.1048C90.9421 24.0832 90.8006 24.0724 90.659 24.0724C90.3328 24.0724 90.0419 24.1417 89.7865 24.2802C89.5341 24.4156 89.3341 24.6049 89.1863 24.848C89.0386 25.0881 88.9647 25.362 88.9647 25.6697V30H87.5844Z"
				fill="white"
			/>
			{brand === "visa" ? (
				<VisaLogo />
			) : brand === "mastercard" ? (
				<MastercardLogo />
			) : (
				""
			)}
			<defs>
				<linearGradient
					id="paint0_linear_960_2034"
					x1="22.6698"
					y1="146.344"
					x2="184.172"
					y2="-15.3357"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#00252E" />
					<stop offset="1" stopColor="#83F8A6" />
				</linearGradient>
				<linearGradient
					id="paint1_linear_960_2034"
					x1="9.13727"
					y1="99.9033"
					x2="143.356"
					y2="99.8299"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#02CAFD" />
					<stop offset="1" stopColor="#83F8A6" />
				</linearGradient>
				<linearGradient
					id="paint2_linear_960_2034"
					x1="-24.1602"
					y1="79.965"
					x2="41.3042"
					y2="14.4289"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#02CAFD" />
					<stop offset="1" stopColor="#83F8A6" />
				</linearGradient>
				<linearGradient
					id="paint3_linear_960_2034"
					x1="67.3234"
					y1="13.367"
					x2="93.8972"
					y2="-13.2359"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#02CAFD" />
					<stop offset="1" stopColor="#83F8A6" />
				</linearGradient>
				<linearGradient
					id="paint4_linear_960_2034"
					x1="322.007"
					y1="125.503"
					x2="91.2727"
					y2="-10.8933"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#02CAFD" />
					<stop offset="1" stopColor="#83F8A6" />
				</linearGradient>
			</defs>
		</svg>
	);
}