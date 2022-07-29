import { NextApiResponse } from "next";
import { NextIronRequest, withSession } from "../../../../util/session";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	if (process.env.NODE_ENV !== "development") return res.status(308).redirect("/").end();
	const user = req.session.get("user");
	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}

	try {
		req.session.set("cart", new Map());
		await req.session.save();
		return res.status(200).json({ cart: new Map() });
	} catch (e: any) {
		console.error(e.message.split(/"/g, ""));
		return res.status(500).json({
			error: "Unable to set cart contents",
			errorMessage: e.message.split(/"/g, ""),
		});
	}
};

export default withSession(handler);
