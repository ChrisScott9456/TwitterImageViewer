import { to } from 'await-to-js';
import { AxiosRequestConfig } from 'axios';
import { CacheInterface } from '../backend/cache/cache.interface';
import { TwitterPost } from '../backend/interfaces/TwitterPost';
import { http } from '../backend/util/http';

export class CacheService {
	static async insertCacheDocument(cacheDoc: CacheInterface) {
		const request: AxiosRequestConfig = {
			method: 'POST',
			url: `/insertCacheDocument`,
			data: cacheDoc,
			timeout: 30000,
		};

		const [e, r] = await to<boolean>(http(request));
		if (e || !r) {
			throw e || new Error('ERROR UPDATING CACHE');
		}

		return r;
	}

	static async getCache(userid: string) {
		const request: AxiosRequestConfig = {
			method: 'GET',
			url: `/getCacheDocument/${userid}`,
			timeout: 30000,
		};

		const [e, r] = await to<CacheInterface>(http(request));
		if (e) {
			throw e;
		}

		return r;
	}

	static addToCache(cache: CacheInterface, posts: TwitterPost[]): [boolean, CacheInterface] {
		let newPosts = posts;

		// Only add new posts if there are already posts in the cache
		if (cache.posts.length > 0) {
			newPosts = posts.filter((post) => !cache.posts.find((el) => `${el.id}` === `${post.id}`));
		}

		// Add new posts to the cache and sort
		cache.posts = [...newPosts, ...cache.posts];
		cache.posts.sort((a, b) => b.id - a.id);

		return [newPosts.length === posts.length, cache]; // return boolean to determine if all the posts that were added are new
	}
}
