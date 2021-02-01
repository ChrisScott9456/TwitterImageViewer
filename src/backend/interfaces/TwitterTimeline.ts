export interface TwitterTimeline {
	data: TwitterTimelineData[];
	includes: TwitterTimelineMedia;
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
