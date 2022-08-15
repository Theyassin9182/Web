import { NextApiResponse } from "next";
import { NextIronRequest, withSession } from "src/util/session";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const user = await req.session.get("user");
	if (!user) {
		return res.status(403).json({ message: "You are not authorized." });
	}

	if (!req.body) return res.status(400).json({ message: "No store configuration was provided. Continue." });

	try {
		req.session.set("store-config", req.body);
		await req.session.save();
	} catch (e: any) {
		console.error(e.message.replace(/"/g, ""));
		return res.status(500).json({ message: "Failed to set configuration" });
	} finally {
		return res.status(200).json({ message: "Configuration set." });
	}
};

export default withSession(handler);
