export interface TwitterTimeline {
	data: TwitterTimelineData[];
	includes: TwitterTimelineMedia;
	meta: TwitterMeta;
}

export interface TwitterTimelineData {
	attachments: {
		media_keys: string[];
	};
	id: string;
	text: string;
}

export interface TwitterTimelineMedia {
	media: [
		{
			media_key: string;
			type: string;
			url: string;
		}
	];
}

export interface TwitterMeta {
	oldest_id?: string;
	newest_id?: string;
	result_count: number;
	next_token?: string;
}
