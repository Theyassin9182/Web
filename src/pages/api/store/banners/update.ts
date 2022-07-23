import { ObjectId } from "mongodb";
import { NextApiResponse } from "next";
import { dbConnect } from "src/util/mongodb";
import { NextIronRequest, withSession } from "src/util/session";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const user = req.session.get("user");
	if (!user) {
		return res.status(401).json({ message: "You need to be logged in." });
	}

	if (!user.developer) {
		return res.status(403).json({ message: "You do not have permission." });
	}

	if (!req.query.id) {
		return res.status(400).json({ message: "No banner ID was provided." });
	}

	const db = await dbConnect();
	try {
		await db.collection("store-banners").updateOne(
			{ _id: new ObjectId(req.query.id as string) },
			{
				$set: {
					...req.body,
					lastUpdated: new Date().getTime(),
					updatedBy: user.id,
				},
			}
		);
		return res.status(200).json({ message: "Banner successfully added." });
	} catch (e: any) {
		console.error(
			`Unable to update banner, requested by ${user.id}, for the following reason:\n`,
			e.message.replace(/"/g, "")
		);
		return res.status(500).json({ message: "Unable to update banner. Please try again later." });
	}
};
export default withSession(handler);
