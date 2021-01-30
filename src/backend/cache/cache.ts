import to from 'await-to-js';
import { TwitterPost } from '../interfaces/TwitterPost';
import { CacheInterface } from './cache.interface';
import { CacheModel } from './cache.model';

export namespace CacheAPIService {
	export async function upsertCacheDocument(_id: string, posts: TwitterPost[]): Promise<boolean> {
		const doc: CacheInterface = {
			_id: _id,
			posts: posts,
		};

		const [e, r] = await to(upsertCache(doc));

		if (e) throw e;
		return true;
	}

	async function upsertCache(cache: CacheInterface) {
		return await CacheModel.updateOne({ _id: cache._id }, { $set: { posts: cache.posts } }, { upsert: true });
	}

	export async function getCacheDocument(userid: string) {
		const [e, r] = await to(getCacheByUserId(userid));

		if (e) throw e;
		return r;
	}

	async function getCacheByUserId(userid: string) {
		return await CacheModel.findById(userid);
	}
}
