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

		if (r.posts) r.posts = this.filterPosts(r.posts);

		return r;
	}

	static addToCache(cache: CacheInterface, posts: TwitterPost[]): [boolean, CacheInterface] {
		let newPosts = posts;

		// Only add new posts if there are already posts in the cache
		if (cache.posts.length > 0) {
			newPosts = posts.filter((post) => !cache.posts.find((el) => `${el.id}` === `${post.id}`));
		}

		// Add new posts to the cache and sort
		cache.posts = this.filterPosts([...newPosts, ...cache.posts]);
		cache.posts.sort((a, b) => Number(BigInt(b.id) - BigInt(a.id)));

		return [newPosts.length === posts.length, cache]; // return boolean to determine if all the posts that were added are new
	}

	/**
	 * This function filters out all posts that do not contain values for all the required fields to be stored into the cache
	 * @param posts - Array of TwitterPost to be filtered out
	 */
	static filterPosts(posts: TwitterPost[]) {
		return posts.filter((post) => {
			return post.id && post.text && post.image_urls.find((el) => el !== null) && post.image_urls.length > 0;
		});
	}
}
