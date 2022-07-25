import { NextApiResponse } from "next";
import { CartItem, Metadata } from "src/pages/store";
import { formatProduct } from "src/util/formatProduct";
import { stripeConnect } from "src/util/stripe";
import { NextIronRequest, withSession } from "../../../../util/session";

// TODO: This route is for the PagedBanner component. Need an improved solution.

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	if (req.method?.toLowerCase() !== "get") {
		return res.status(405).json({
			error: `Method '${req.method?.toUpperCase()}' cannot be used on this endpoint.`,
		});
	}

	const user = req.session.get("user");
	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}

	if (!req.query.id) {
		return res.status(400).json({ message: "No product Id was provided to add to the store." });
	}

	const stripe = stripeConnect();
	const cart: CartItem[] = (await req.session.get("cart")) ?? [];

	let toastMessage: string | undefined;
	const product = await stripe.products.retrieve(req.query.id as string);

	if (!product) {
		return res.status(410).json({ message: "No product was found with the provided id" });
	}

	const typeToAdd = (product.metadata as Metadata)!.type;
	const cartHasSubscription = cart.filter((i) => i.type === "subscription").length >= 1;
	const cartHasSingle = cart.filter((i) => i.type === "single").length >= 1;

	if (typeToAdd === "subscription" && cartHasSubscription) {
		toastMessage = "Only one subscription should be added your cart at a time.";
	} else if (typeToAdd === "subscription" && cartHasSingle) {
		toastMessage = "You cannot combine subscription and single-purchase products.";
	} else if (typeToAdd == "single" && cartHasSubscription) {
		toastMessage = "You cannot combine subscription and single-purchase products.";
	}

	if (toastMessage) {
		return res.status(422).json({ message: toastMessage });
	}

	try {
		const alreadyExists = cart.findIndex((i) => i.id === product.id);
		if (alreadyExists !== -1) {
			let cartCopy = cart.slice();
			cartCopy[alreadyExists].quantity += 1;
			req.session.set("cart", cartCopy);
			await req.session.save();
		} else {
			let cartCopy = cart.slice();
			const formattedProduct = await formatProduct("cart-item", product.id, stripe);
			req.session.set("cart", [...cartCopy, formattedProduct]);
			await req.session.save();
		}
		return res.status(200).json({ message: "Successfully added product to cart." });
	} catch (e) {
		console.error(e);
		return res.status(500).json({
			message: "Unable to add cart item",
		});
	}
};

export default withSession(handler);
