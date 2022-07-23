import { NextApiResponse } from "next";
import { BannerPage } from "src/components/store/PagedBanner";
import { UserData } from "src/types";
import { dbConnect } from "src/util/mongodb";
import { NextIronRequest, withSession } from "src/util/session";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const user = req.session.get("user");
	if (!user) {
		return res.status(401).json({ message: "You need to be logged in." });
	}

	let onlyActive = false;
	if (req.query.active || !user.developer) {
		onlyActive = true;
	}

	const db = await dbConnect();
	let banners: BannerPage[] = [];

	if (onlyActive) {
		banners = (await db
			.collection("store-banners")
			.aggregate([
				{
					$match: { active: true },
				},
				{
					$unset: ["_id", "createdBy", "createdAt", "active"],
				},
			])
			.toArray()) as BannerPage[];
	} else {
		const bannersRaw = (await db.collection("store-banners").find({}).toArray()) as BannerPage[];
		for (let banner of bannersRaw) {
			if (banner.createdBy) {
				const dbUser = (await db.collection("users").findOne({ _id: banner.createdBy })) as UserData;
				if (banner.updatedBy && banner.updatedBy !== banner.createdBy) {
					const dbUser = (await db.collection("users").findOne({ _id: banner.createdBy })) as UserData;
					if (dbUser) {
						banner.updatedBy = {
							id: banner.createdBy as string,
							username: dbUser.name,
							discriminator: dbUser.discriminator,
						};
					}
				}
				if (dbUser) {
					banner.createdBy = {
						id: banner.createdBy as string,
						username: dbUser.name,
						discriminator: dbUser.discriminator,
					};
				}
			}
			banners.push(banner);
		}
	}

	if (!banners || banners.length < 1) {
		return res.status(501).json({ message: "There is no existing banners in the database." });
	}

	return res.status(200).json(banners);
};
export default withSession(handler);
