import { to } from 'await-to-js';
import { AxiosRequestConfig } from 'axios';
import { TwitterPost } from '../backend/interfaces/TwitterPost';
import { TwitterTimeline } from '../backend/interfaces/TwitterTimeline';
import { http } from '../backend/util/http';

export class TwitterService {
	static async getTwitterIDByUsername(username: string) {
		const request: AxiosRequestConfig = {
			method: 'GET',
			url: `/getTwitterIDByUsername/${username}`,
		};

		const [e, r] = await to<{ id: string }>(http(request));
		if (e || !r) {
			throw e;
		}

		return r?.id;
	}

	static async getTwitterTimeline(userid: string, maxResults?: string, lastid?: string) {
		const request: AxiosRequestConfig = {
			method: 'GET',
			url: `/getTwitterTimeline/${userid}/${maxResults}/${lastid}`,
		};

		const [e, r] = await to<TwitterTimeline>(http(request));
		if (e || !r) {
			throw e;
		}

		return r;
	}

	static addToCache(posts: TwitterPost[], cache: Map<number, TwitterPost> = new Map()): Map<number, TwitterPost> {
		// Get all posts that don't already exist in the cache
		const newPosts = posts.filter((post) => !cache.get(post.id));

		// Add all new posts to the cache map
		for (const post of newPosts) {
			cache.set(post.id, { text: post.text, image_url: post.image_url });
		}

		// Return a new map that is sorted by id
		return new Map([...cache.entries()].sort((a, b) => b[0] - a[0]));
	}

	static extractPostsFromTimeline(arr: TwitterTimeline): TwitterPost[] {
		const newArr = arr.data.map((data) => {
			return {
				id: parseInt(data.id),
				text: data.text,
				image_url: arr?.includes?.media.find((media) => {
					if (!data.attachments) return null;

					return data?.attachments.media_keys.find((key) => {
						return media.media_key === key;
					});
				})?.url,
			};
		});

		return newArr.filter((el) => el.image_url);
	}
}
