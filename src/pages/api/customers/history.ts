import { Db } from "mongodb";
import { NextApiResponse } from "next";
import { dbConnect } from "src/util/mongodb";
import { NextIronRequest, withSession } from "src/util/session";
import { stripeConnect } from "src/util/stripe";
import { PurchaseRecord } from "../store/checkout/finalize/paypal";

interface AggregatedData {
	discordId: string;
	purchases: PurchaseRecord[];
}

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const user = req.session.get("user");
	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}
	const db: Db = await dbConnect();
	const stripe = stripeConnect();

	const purchaseHistory = (
		await db
			.collection("customers")
			.aggregate([
				{
					$match: {
						discordId: req.query.id,
					},
				},
				{
					$lookup: {
						from: "purchases",
						localField: "purchases.id",
						foreignField: "_id",
						as: "data",
					},
				},
				{
					$addFields: {
						"data.gateway": {
							$arrayElemAt: ["$purchases.type", 0],
						},
					},
				},
				{
					$project: {
						discordId: req.query.id,
						purchases: "$data",
					},
				},
				{
					$unset: ["_id"],
				},
			])
			.toArray()
	)[0] as AggregatedData;

	for (let purchase of purchaseHistory.purchases) {
		for (let item of purchase.items) {
			item = Object.assign(item, { image: (await stripe.products.retrieve(item.id)).images[0] });
		}
	}

	return res.status(200).json({ purchases: purchaseHistory });
};

export default withSession(handler);