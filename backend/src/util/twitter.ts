import { to } from 'await-to-js';
import { AxiosRequestConfig } from 'axios';
import { TwitterPost } from '../../../src/interfaces/TwitterPost';
import { TwitterTimeline } from '../../../src/interfaces/TwitterTimeline';
import { TwitterUser } from '../../../src/interfaces/TwitterUser';
import { http } from '../../../src/util/http';

const twitterAuth = require('../../../src/keyfiles/twitter.json');

export namespace TwitterService {
	export async function getTwitterIDByUsername(username: string) {
		const request: AxiosRequestConfig = {
			method: 'GET',
			url: `users/by/username/${username}?`,
			headers: {
				Authorization: 'Bearer ' + twitterAuth.bearer_token,
			},
		};

		const [e, r] = await to<TwitterUser>(http(request));
		if (e || !r) {
			return '';
		}

		return r?.data?.id;
	}

	export function extractPostsFromTimeline(arr: TwitterTimeline): TwitterPost[] {
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

	export async function getTwitterTimeline(userid: string, maxResults?: string, lastid?: string): Promise<TwitterTimeline> {
		const lastIdParam = lastid ? `&until_id=${lastid}` : '';

		const request: AxiosRequestConfig = {
			method: 'GET',
			url: `users/${userid}/tweets?max_results=${maxResults || 5}&media.fields=url${lastIdParam}&expansions=attachments.media_keys&exclude=retweets,replies`,
			headers: {
				Authorization: 'Bearer ' + twitterAuth.bearer_token,
			},
		};

		const [e, r] = await to<TwitterTimeline>(http(request));
		if (e || !r) {
			return null;
		}

		return r;
	}

	export function addToCache(posts: TwitterPost[], cache: Map<number, TwitterPost> = new Map()): Map<number, TwitterPost> {
		// Get all posts that don't already exist in the cache
		const newPosts = posts.filter((post) => !cache.get(post.id));

		// Add all new posts to the cache map
		for (const post of newPosts) {
			cache.set(post.id, { text: post.text, image_url: post.image_url });
		}

		// Return a new map that is sorted by id
		return new Map([...cache.entries()].sort((a, b) => b[0] - a[0]));
	}
}
