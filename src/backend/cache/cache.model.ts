import { Schema, model, Model } from 'mongoose';
import { CacheDocument } from './cache.interface';
interface CacheModel extends Model<CacheDocument> {}

const schema = new Schema({
	_id: { type: String, required: true },
	posts: {
		type: [
			{
				id: { type: String, required: true },
				text: { type: String, required: true },
				image_url: { type: String, required: true },
			},
		],
		required: true,
	},
});

export const CacheModel = model<CacheDocument>('Cache', schema, 'Cache');
