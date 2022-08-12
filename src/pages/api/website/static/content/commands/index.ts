import { NextApiResponse } from "next";
import { StaticResource, UserData } from "src/types";
import { dbConnect } from "src/util/mongodb";
import { NextIronRequest, withSession } from "src/util/session";

export interface CommandResource {
	name: string;
	aliases: string[];
	category: string;
	usage: string;
	description: string;
	permissions: string[];
}

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const user = req.session.get("user") as UserData;

	if (!user || !user.developer) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	const db = await dbConnect();
	const categories = (await db
		.collection("static")
		.findOne({ label: "content-commands" })) as StaticResource<CommandResource>;

	return res.status(200).json(categories?.content ?? []);
};

export default withSession(handler);
