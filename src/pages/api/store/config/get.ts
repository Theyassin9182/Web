import { NextApiResponse } from "next";
import { NextIronRequest, withSession } from "src/util/session";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const user = await req.session.get("user");
	if (!user) {
		return res.status(403).json({ message: "You are not authorized." });
	}

	const config = await req.session.get("store-config");
	if (!config) {
		return res.status(404).json({ message: "Unable to retrieve store configuration" });
	}
	return res.status(200).json({ message: "Configuration retrieved.", config: config });
};

export default withSession(handler);
