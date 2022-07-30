import { NextApiResponse } from "next";
import CartController from "src/util/cart/controller";
import { NextIronRequest, withSession } from "../../../../util/session";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const user = req.session.get("user");
	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}

	const discount = await req.session.get("discountCode");
	const controller = new CartController(req.session.get("cart"));
	const cart = controller.iterable();
	if (discount && cart[0].type === "subscription") {
		req.session.unset("discountCode");
		await req.session.save();
		return res.status(406).json({ error: "Discount could not be applied to this cart" });
	}

	if (!discount) {
		return res.status(410).json({ error: "No active discount code" });
	}

	return res.status(200).json(discount);
};

export default withSession(handler);
