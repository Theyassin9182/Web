import { NextApiResponse } from "next";
import { accessCart } from "src/util/cart";
import { NextIronRequest, withSession } from "../../../../util/session";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	if (req.method?.toLowerCase() !== "get") {
		return res.status(405).json({
			error: `Method '${req.method?.toUpperCase()}' cannot be used on this endpoint.`,
		});
	}

	const cart = accessCart(req.session.get("cart"));
	const user = req.session.get("user");
	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}

	return res.status(200).json({ cart: cart.list() });
};

export default withSession(handler);
