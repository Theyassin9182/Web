import { ObjectId } from "mongodb";
import { NextApiResponse } from "next";
import { BannerPage } from "src/components/store/PagedBanner";
import { dbConnect } from "src/util/mongodb";
import { NextIronRequest, withSession } from "src/util/session";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const user = req.session.get("user");
	if (!user) {
		return res.status(401).json({ message: "You need to be logged in." });
	}

	if (!user.developer) {
		return res.status(403).json({ message: "You don't have permission." });
	}

	if (!req.query.id) {
		return res.status(400).json({ message: "No banner ID was provided." });
	}

	const db = await dbConnect();
	const banner = (await db
		.collection("store-banners")
		.findOne({ _id: new ObjectId(req.query.id as string) })) as BannerPage;

	if (!banner) {
		return res.status(404).json({ message: "No banner with the provided id was found." });
	}

	return res.status(200).json(banner);
};
export default withSession(handler);
