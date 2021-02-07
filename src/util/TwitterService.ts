import { to } from 'await-to-js';
import { AxiosRequestConfig } from 'axios';
import { TwitterPost } from '../backend/interfaces/TwitterPost';
import { TwitterTimeline, TwitterTimelineData, TwitterTimelineMedia } from '../backend/interfaces/TwitterTimeline';
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
			url: `/getTwitterTimeline/${userid}/${maxResults}/${lastid || ''}`,
		};

		const [e, r] = await to<TwitterTimeline>(http(request));
		if (e || !r) {
			throw e;
		}

		return r;
	}

	static getImageUrls(data: TwitterTimelineData, includes: TwitterTimelineMedia): string[] {
		if (!data?.attachments) return null; // If no media included, return null

		return data.attachments.media_keys.map((media_key) => {
			return includes.media.find((key) => {
				return key.media_key === media_key && key.type === 'photo';
			})?.url;
		});
	}

	static extractPostsFromTimeline(arr: TwitterTimeline): TwitterPost[] {
		const newArr: TwitterPost[] = arr.data.map((data) => {
			return {
				id: data.id,
				text: data.text,
				image_urls: (this.getImageUrls(data, arr.includes) || []).filter((el) => el !== undefined),
			};
		});

		return newArr.filter((el) => el?.image_urls.length > 0); // Only return results with image_urls
	}
}
