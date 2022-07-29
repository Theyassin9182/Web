import { NextApiResponse } from "next";
import CartController from "src/util/cart/controller";
import { NextIronRequest, withSession } from "../../../../util/session";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	if (req.method?.toLowerCase() !== "put") {
		return res.status(405).json({
			error: `Method '${req.method?.toUpperCase()}' cannot be used on this endpoint.`,
		});
	}

	const controller = new CartController(req.session.get("cart"));
	const user = req.session.get("user");
	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}

	if (!req.body || !req.body.cartData) {
		return res.status(400).json({ error: "Invalid or no body." });
	}

	try {
		controller.overrideWith(req.body.cartData);
		req.session.set("cart", controller.list());
		await req.session.save();
		return res.status(200).json({ cart: controller.list() });
	} catch (e: any) {
		console.error(e.message.split(/"/g, ""));
		return res.status(500).json({
			error: "Unable to set cart contents",
			errorMessage: e.message.split(/"/g, ""),
		});
	}
};

export default withSession(handler);
