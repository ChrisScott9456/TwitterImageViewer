import React from 'react';
import Search from 'antd/lib/input/Search';
import { Card, List, Image } from 'antd';
import { TwitterPost } from '../interfaces/TwitterPost';
import { Meta } from 'antd/lib/list/Item';
import { TwitterService } from '../util/twitter';

const twitterRegex = new RegExp(/https:\/\/t.co\/.*/g);
const paginationSize = 10;

let cachedPosts = new Map<number, TwitterPost>();

interface State {
	dataSet: TwitterPost[];
	searchValue: string;
	userid: string;
	thing: string;
	paginationSize: number;
}

class SearchPage extends React.Component {
	state: State = {
		dataSet: [],
		searchValue: '',
		userid: '',
		thing: '',
		paginationSize: 10,
	};

	performSearch = async (username: string) => {
		const id = await TwitterService.getTwitterIDByUsername(username);
		this.setState({ userid: id });

		const initTimeline = await TwitterService.getTwitterTimeline(id);

		if (initTimeline) {
			const initPosts = TwitterService.extractPostsFromTimeline(initTimeline);
			cachedPosts = TwitterService.addToCache(initPosts, cachedPosts);
			const initSet = [...cachedPosts.values()];
			this.setState({ dataSet: initSet });
		}

		// while (this.state.dataSet.length > this.state.paginationSize) {
		// 	const timeline = await TwitterService.getTwitterTimeline(id, this.state.paginationSize);
		// 	const posts = TwitterService.extractPostsFromTimeline(timeline);

		// 	cachedPosts = TwitterService.addToCache(posts, cachedPosts);
		// 	const set = [...cachedPosts.values()];
		// 	this.setState({ dataSet: set });
		// }
	};

	render() {
		return (
			<div>
				<p>{this.state.thing}</p>
				<Search className="search" placeholder="Enter Twitter Username" onSearch={this.performSearch} addonBefore="@" />
				{this.state.dataSet.length > 0 ? (
					<List
						pagination={{ showSizeChanger: true, position: 'both' }}
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
