import { NextApiResponse } from "next";
import { dbConnect } from "src/util/mongodb";
import { NextIronRequest, withSession } from "src/util/session";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const user = await req.session.get("user");
	if (!user) {
		return res.status(403).json({ message: "You are unauthorized." });
	}

	if (!user.developer) {
		return res.status(403).json({ message: "You are unauthorized." });
	}

	const db = await dbConnect();
	const refunds = await db.collection("refunds").find({}).toArray();

	return res.status(200).json({ refunds });
};

export default withSession(handler);
