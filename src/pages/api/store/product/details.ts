import { NextApiResponse } from "next";
import { NextIronRequest, withSession } from "../../../../util/session";
import { dbConnect } from "src/util/mongodb";
import { stripeConnect } from "src/util/stripe";
import { Metadata, ProductType } from "src/pages/store";
import Stripe from "stripe";
import { redisConnect } from "src/util/redis";
import { TIME } from "src/constants";

export interface ProductDetails {
	id: string;
	name: string;
	image: string;
	type: ProductType;
	category?: string;
	prices: DetailedPrice[];
	body: ProductBodies;
}

export interface DetailedPrice {
	id: string;
	value: number;
	interval?: DetailedPriceInterval;
	paypalPlan?: string;
	giftProductId?: string;
}

export interface DetailedPriceInterval {
	period: Stripe.Price.Recurring.Interval;
	count: number;
}

interface ProductBodies {
	primary: ProductContent;
	secondary?: Partial<ProductContent>;
}

interface ProductContent {
	title: string;
	content: string;
}

interface ProductRecord {
	_id: string;
	primaryTitle: string;
	primaryBody: string;
	secondaryTitle?: string;
	secondaryBody?: string;
}

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const user = req.session.get("user");

	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}

	const db = await dbConnect();
	const redis = await redisConnect();

	const stripe = stripeConnect();
	const productId = req.query.id?.toString();
	if (!productId) {
		return res.status(400).json({ error: "No product id given." });
	}

	const cached = await redis.get(`store:products:${productId}`);
	if (cached) {
		return res.status(200).json(JSON.parse(cached));
	}

	const stripeProduct = await stripe.products.retrieve(productId);
	const prices = (
		await stripe.prices.list({
			active: true,
			product: stripeProduct.id,
		})
	).data
		.sort((a, b) => a.unit_amount! - b.unit_amount!)
		.map((price) => ({
			id: price.id,
			value: price.unit_amount!,
			...(price.recurring && {
				interval: {
					period: price.recurring.interval,
					count: price.recurring.interval_count,
				},
			}),
		}));
	const dbProduct = (await db.collection("products").findOne({ _id: productId })) as ProductRecord;
	if (!dbProduct || !stripeProduct) return res.status(404).json({ error: "Product with given id was not found." });

	const detailedResponse: ProductDetails = {
		id: stripeProduct.id,
		name: stripeProduct.name,
		image: stripeProduct.images[0],
		type: (stripeProduct.metadata as Metadata).type!,
		...((stripeProduct.metadata as Metadata).category && {
			category: (stripeProduct.metadata as Metadata).category,
		}),
		prices,
		body: {
			primary: {
				title: dbProduct.primaryTitle,
				content: dbProduct.primaryBody,
			},
			secondary: {
				title: dbProduct.secondaryTitle,
				content: dbProduct.secondaryBody,
			},
		},
	};
	await redis.set(`store:products:${productId}`, JSON.stringify(detailedResponse), "PX", TIME.month);

	return res.status(200).json(detailedResponse);
};

export default withSession(handler);
