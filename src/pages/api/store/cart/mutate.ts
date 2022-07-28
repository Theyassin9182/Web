import { NextApiResponse } from "next";
import { CartItem } from "src/pages/store";
import { accessCart } from "src/util/cart";
import { NextIronRequest, withSession } from "../../../../util/session";

export const PossibleMutations = ["delete", "update"] as const;
export const MutationTasks = ["incrqty", "decrqty", "setqty"] as const;

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	if (req.method?.toLowerCase() !== "patch") {
		return res.status(405).json({
			message: `Method '${req.method?.toUpperCase()}' cannot be used on this endpoint.`,
		});
	}

	const user = req.session.get("user");
	if (!user) {
		return res.status(401).json({ message: "You are not logged in." });
	}

	const action = req.query.action as typeof PossibleMutations[number];
	if (!action || !PossibleMutations.includes(action)) {
		return res.status(400).json({ message: "Invalid mutation action." });
	}

	if (!req.query.id) {
		return res.status(400).json({ message: "Mutations require a product ID." });
	}

	if (!req.body && action !== "delete") {
		return res.status(400).json({ message: "Invalid or no body." });
	}

	const controller = accessCart(req.session.get("cart"));
	const productId = req.query.id?.toString();
	if (!controller.has(productId)) {
		return res.status(400).json({
			message: `No product with that ID exists within your cart.`,
		});
	}
	try {
		switch (action) {
			case "delete":
				controller.delItem(productId);
				break;
			case "update":
				const task = req.query.task as typeof MutationTasks[number];
				if (!task || !MutationTasks.includes(task)) {
					return res.status(400).json({ message: "Invalid update task." });
				}
				switch (task) {
					case "incrqty":
						controller.increaseQuantity(productId, parseInt((req.body.quantity as string) ?? 1));
						break;
					case "decrqty":
						controller.decreaseQuantity(productId, parseInt((req.body.quantity as string) ?? 1));
						break;
					case "setqty":
						controller.setItemQuantity(productId, parseInt((req.body.quantity as string) ?? 1));
						break;
				}
		}
		req.session.set("cart", controller.list());
		await req.session.save();
		return res.status(200).json({ ...controller.list() });
	} catch (e: any) {
		console.error(e.message.replace(/"/g, ""));
		return res.status(500).json({
			error: "Failed to mutate that item.",
			errorMessage: process.env.NODE_ENV === "development" ? e.message.replace(/"/g, "") : "",
		});
	}
};

export default withSession(handler);
