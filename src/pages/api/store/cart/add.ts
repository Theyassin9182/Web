import { NextApiResponse } from "next";
import { accessCart } from "src/util/cart";
import { NextIronRequest, withSession } from "../../../../util/session";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	if (req.method?.toLowerCase() !== "put") {
		return res.status(405).json({
			error: `Method '${req.method?.toUpperCase()}' cannot be used on this endpoint.`,
		});
	}

	const user = req.session.get("user");
	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}

	if (!req.body) {
		return res.status(400).json({ error: "Invalid or no body." });
	}

	try {
		const controller = accessCart(req.session.get("cart"));

		const idToCreate = req.query.id?.toString();
		if (idToCreate) {
			if (controller.has(idToCreate)) {
				return res.status(400).json({
					message: `An item in the cart already exists with that ID. If you want to change the quantity, use /api/store/cart/set?id=${idToCreate} instead`,
				});
			}
			controller
				.addItem(idToCreate, req.body)
				.catch((e) => res.status(400).json({ error: e.message.replace(/"/g, "") }));
			req.session.set("cart", controller.list());

			await req.session.save();
			return res.status(200).json({ cart: controller.list() });
		}
	} catch (e: any) {
		console.error(e.message.split(/"/g, ""));
		return res.status(500).json({
			error: "Unable to set cart contents",
			errorMessage: e.message.split(/"/g, ""),
		});
	}
};

export default withSession(handler);
