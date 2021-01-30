import { to } from 'await-to-js';
import { AxiosRequestConfig } from 'axios';
import { TwitterPost } from '../interfaces/TwitterPost';
import { TwitterTimeline } from '../interfaces/TwitterTimeline';
import { TwitterUser } from '../interfaces/TwitterUser';
import { http } from './http';
import { twitterAuth } from '../keyfiles/twitter';

export namespace TwitterAPIService {
	export async function getTwitterIDByUsername(username: string) {
		const request: AxiosRequestConfig = {
			method: 'GET',
			url: `https://api.twitter.com/2/users/by/username/${username}?`,
			headers: {
				Authorization: 'Bearer ' + twitterAuth.bearer_token,
			},
		};

		const [e, r] = await to<TwitterUser>(http(request));
		if (e || !r) {
			throw e || new Error('ERROR GETTING USER ID');
		}

		return { id: r?.data?.id };
	}

	export async function getTwitterTimeline(userid: string, maxResults?: string, lastid?: string): Promise<TwitterTimeline> {
		const lastIdParam = !lastid || lastid === 'undefined' ? '' : `&until_id=${lastid}`; // If lastid isn't set or is "undefined", set as empty string

		const request: AxiosRequestConfig = {
			method: 'GET',
			url: `https://api.twitter.com/2/users/${userid}/tweets?max_results=${maxResults || 5}&media.fields=url${lastIdParam}&expansions=attachments.media_keys&exclude=retweets,replies`,
			headers: {
				Authorization: 'Bearer ' + twitterAuth.bearer_token,
			},
		};

		const [e, r] = await to<TwitterTimeline>(http(request));
		if (e || !r) {
			throw e || new Error('ERROR GETTING TIMELINE');
		}

		return r;
	}
}
