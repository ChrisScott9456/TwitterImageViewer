import React from 'react';
import Search from 'antd/lib/input/Search';
import { Card, List, Image } from 'antd';
import { Meta } from 'antd/lib/list/Item';
import { TwitterService } from '../util/TwitterService';
import { CacheService } from '../util/CacheService';
import { CacheInterface } from '../backend/cache/cache.interface';

const twitterRegex = new RegExp(/https:\/\/t.co\/.*/g);

interface State {
	dataSet: CacheInterface;
	searchValue: string;
	currentPage: number;
	paginationSize: number;
	paginationId: string;
	searchCounter: number;
	timelineFlag: boolean;
}

class SearchPage extends React.Component {
	state: State = {
		dataSet: { _id: '', posts: [] },
		searchValue: '',
		currentPage: 1,
		paginationSize: 10,
		paginationId: '',
		searchCounter: 0,
		timelineFlag: false,
	};

	onSearch = async (username: string) => {
		this.setState({ timelineFlag: false });
		const id = await TwitterService.getTwitterIDByUsername(username);
		if (!id) return;

		await this.executeSearch(id);
	};

	executeSearch = async (userid: string, lastid?: string, maxResults?: string) => {
		if (this.state.timelineFlag) return;

		// Get cache for the current user
		const cache = await CacheService.getCache(userid);

		// Get latest timeline information
		const timeline = await TwitterService.getTwitterTimeline(userid, maxResults || '5', lastid);
		if (!timeline || !timeline?.data) {
			console.error('FAILED TO RETRIEVE TIMELINE');
			if (maxResults) this.setState({ timelineFlag: true });
			return;
		}

		this.setState({ paginationId: timeline.data[timeline.data.length - 1].id });
		const posts = TwitterService.extractPostsFromTimeline(timeline);

		// Build current cache
		const [getMore, newCache] = CacheService.addToCache(cache || { _id: userid, posts: [] }, posts);
		this.setState({ dataSet: newCache });

		// Add new posts to the cache
		const cacheSuccess = await CacheService.insertCacheDocument(newCache);
		if (!cacheSuccess) console.error('FAILED TO UPDATE CACHE WITH LATEST POSTS');

		// Set lastid to the last id of the cache
		if (!getMore) {
			this.setState({ paginationId: newCache.posts[newCache.posts.length - 1].id });
		}

		// Recursively get more search results
		if (
			getMore && // If the cache isn't up to date yet
			this.state.searchCounter <= 50 && // If we haven't surpassed the maximum search amount
			this.state.dataSet.posts.length < this.state.paginationSize * (this.state.currentPage + 9) // If the current number of posts is less than the max # of default pages
		) {
			this.setState({ searchCounter: this.state.searchCounter++ });
			await this.executeSearch(userid, this.state.paginationId);

			// Reset counter once we reach the max for the next search
		} else if (this.state.searchCounter > 50) {
			this.setState({ searchCounter: 0 });
		}
	};

	changePage(page: number) {
		// Max 500 results && if on the last page -- get more results
		if (this.state.dataSet.posts.length < 500 && page === Math.ceil(this.state.dataSet.posts.length / this.state.paginationSize)) {
			this.executeSearch(this.state.dataSet._id, this.state.paginationId, '10');
		}
		this.setState({ currentPage: page });
	}

	render() {
		return (
			<div>
				<Search className="search" placeholder="Enter Twitter Username" onSearch={this.onSearch} addonBefore="@" />
				{this.state.dataSet.posts.length > 0 ? (
					<List
						pagination={{
							current: this.state.currentPage,
							showSizeChanger: true,
							position: 'both',
							onChange: (page) => this.changePage(page),
							onShowSizeChange: (current, size) => this.setState({ currentPage: current, paginationSize: size.toString() }),
						}}
						grid={{ gutter: 16, column: 5 }}
						dataSource={this.state.dataSet.posts}
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
