export interface TwitterTimeline {
	data: [
		{
			attachments: {
				media_keys: string[];
			};
			id: string;
			text: string;
		}
	];
	includes: {
		media: [
			{
				media_key: string;
				type: string;
				url: string;
			}
		];
	};
}
