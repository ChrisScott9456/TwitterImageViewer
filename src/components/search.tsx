import React from 'react';
import Search from 'antd/lib/input/Search';
import { Card, List, Image } from 'antd';
import { TwitterPost } from '../interfaces/TwitterPost';
import { Meta } from 'antd/lib/list/Item';
import { TwitterService } from '../util/twitter';
import to from 'await-to-js';
import { AxiosRequestConfig } from 'axios';
import { http } from '../util/http';

const twitterRegex = new RegExp(/https:\/\/t.co\/.*/g);
let cachedPosts = new Map<string, Map<number, TwitterPost>>();

const test = async () => {
	const request: AxiosRequestConfig = {
		method: 'GET',
		url: `/`,
	};

	const [e, r] = await to(http(request));
	if (e || !r) {
		console.log(e || 'ERROR');
	}

	console.log(r);
};

test();

interface State {
	dataSet: TwitterPost[];
	searchValue: string;
	userid: string;
	thing: string;
	currentPage: number;
	paginationSize: number;
	paginationId: string;
	searchCounter: number;
}

class SearchPage extends React.Component {
	state: State = {
		dataSet: [],
		searchValue: '',
		userid: '',
		thing: '',
		currentPage: 1,
		paginationSize: 10,
		paginationId: '',
		searchCounter: 0,
	};

	onSearch = async (username: string) => {
		const id = await TwitterService.getTwitterIDByUsername(username);
		this.setState({ userid: id });

		await this.executeSearch(id);
	};

	executeSearch = async (id: string, lastid?: string) => {
		console.log(this.state.dataSet.length);
		// Get latest timeline information
		const timeline = await TwitterService.getTwitterTimeline(id, 10, lastid);
		this.setState({ paginationId: timeline.data[timeline.data.length - 1].id });
		const posts = TwitterService.extractPostsFromTimeline(timeline);

		// Add new posts to the cachedPosts and set dataSet to display
		cachedPosts.set(id, TwitterService.addToCache(posts, cachedPosts.get(id)));
		const set = [...cachedPosts.get(id).values()];
		this.setState({ dataSet: set });

		// Get more search results
		if (this.state.searchCounter <= 50 && this.state.dataSet.length < this.state.paginationSize * (this.state.currentPage + 9)) {
			this.setState({ searchCounter: this.state.searchCounter++ });
			await this.executeSearch(id, this.state.paginationId);

			// Reset counter once we reach the max for the next search
		} else if (this.state.searchCounter > 50) {
			this.setState({ searchCounter: 0 });
		}
	};

	render() {
		return (
			<div>
				<p>{this.state.thing}</p>
				<Search className="search" placeholder="Enter Twitter Username" onSearch={this.onSearch} addonBefore="@" />
				{this.state.dataSet.length > 0 ? (
					<List
						pagination={{
							current: this.state.currentPage,
							showSizeChanger: true,
							position: 'both',
							onChange: (page) => this.setState({ currentPage: page }),
						}}
						grid={{ gutter: 16, column: 5 }}
						dataSource={this.state.dataSet}
						renderItem={(item) => (
							<List.Item>
								<Card hoverable cover={<Image src={item.image_url} />}>
									<Meta
										title={
											<a href={item.text.match(twitterRegex)?.[0]} target="_blank" rel="noreferrer">
												{item.text}
											</a>
										}
									/>
								</Card>
							</List.Item>
						)}
					/>
				) : null}
			</div>
		);
	}
}

export default SearchPage;
