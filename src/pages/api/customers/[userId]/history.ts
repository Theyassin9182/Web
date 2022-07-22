import { Db } from "mongodb";
import { NextApiResponse } from "next";
import { Refund, RefundStatus } from "src/components/dashboard/account/purchases/PurchaseViewer";
import { TIME } from "src/constants";
import { Metadata } from "src/pages/store";
import { dbConnect } from "src/util/mongodb";
import { redisConnect } from "src/util/redis";
import { NextIronRequest, withSession } from "src/util/session";
import { stripeConnect } from "src/util/stripe";
import Stripe from "stripe";
import { PurchaseRecord } from "../../store/checkout/finalize/paypal";
import { PaymentIntentItemDiscount, PaymentIntentItemResult } from "../../store/webhooks/stripe";

// TODO: Optimize this entire path, very slow, 4 second initial load

export type DiscountData = PaymentIntentItemDiscount & {
	ignore?: boolean;
};

export type AggregatedPurchaseRecordPurchases = Omit<PurchaseRecord & { gateway: "stripe" | "paypal" }, "items"> & {
	_id: string;
	items: (PaymentIntentItemResult & {
		id: string;
		image: string;
		metadata: Metadata;
		priceObject?: PriceObject;
	})[];
	discounts: DiscountData[];
	type: Metadata["type"];
	metadata: Metadata;
	refundStatus?: RefundStatus;
};

export interface PriceObject {
	value: number;
	interval: Stripe.Price.Recurring.Interval;
	interval_count: number;
}

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const user = req.session.get("user");
	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}
	const db: Db = await dbConnect();
	const stripe = stripeConnect();
	const redis = await redisConnect();

	const cached = await redis.get(`customer:purchase-history:${req.query.userId}`);
	if (cached) {
		return res.status(200).json({ history: JSON.parse(cached) });
	}

	const purchaseHistory = (await db
		.collection("purchases")
		.find({ boughtBy: req.query.userId })
		.toArray()) as AggregatedPurchaseRecordPurchases[];

	for (let purchase of purchaseHistory) {
		const refund = (await db.collection("refunds").findOne({ order: purchase._id })) as Refund;
		if (refund) {
			purchase.refundStatus = refund.status;
		}

		for (let item of purchase.items) {
			const product = await stripe.products.retrieve(item.id);
			purchase.type = (product.metadata as Metadata).type;

			if (product.metadata.type === "giftable") {
				const price = (
					await stripe.prices.search({
						query: `metadata['giftProduct']:'${product.id}'`,
					})
				).data[0];

				item.priceObject = {
					value: item.price,
					interval: price!.recurring!.interval,
					interval_count: price!.recurring!.interval_count,
				} as PriceObject;
			} else if (product.metadata.type === "subscription") {
				const prices = (
					await stripe.prices.list({
						active: true,
						product: product.id,
					})
				).data;

				const price = prices.find((price) => price.unit_amount! / 100 === item.price / item.quantity);
				item.priceObject = {
					value: item.price,
					interval: price!.recurring!.interval,
					interval_count: price!.recurring!.interval_count,
				} as PriceObject;
			}
			item = Object.assign(item, {
				image: product.images[0],
				metadata: {
					...(product.metadata.type === "giftable" && {
						mainInterval: product.metadata.mainInterval,
					}),
				},
			});
		}
	}

	await redis.set(`customer:purchase-history:${req.query.userId}`, JSON.stringify(purchaseHistory), "PX", TIME.month);

	return res.status(200).json({ history: purchaseHistory });
};

export default withSession(handler);
