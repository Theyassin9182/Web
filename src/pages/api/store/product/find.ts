import { NextApiResponse } from "next";
import { NextIronRequest, withSession } from "../../../../util/session";
import { stripeConnect } from "src/util/stripe";
import { formatProduct } from "src/util/formatProduct";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const user = req.session.get("user");

	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}

	if (!req.query.id) {
		return res.status(400).json({ message: "No product ID was provided." });
	}

	const stripe = stripeConnect();

	if (req.query.action) {
		switch (req.query.action) {
			case "format":
				const desiredFormat = req.query.to?.toString();
				if (!desiredFormat) {
					return res.status(400).json({
						message: "The new (to) format is required to output this object correctly.",
					});
				}

				// @ts-expect-error
				return res.status(200).json(await formatProduct(desiredFormat, req.query.id.toString(), stripe));
			default:
				return res.status(400).json({
					message: "The action you provided is unsupported.",
				});
		}
	}
};

export default withSession(handler);
