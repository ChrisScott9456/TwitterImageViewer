import React from 'react';
import Search from 'antd/lib/input/Search';
import { Card, List, Image } from 'antd';
import { Meta } from 'antd/lib/list/Item';
import { TwitterService } from '../util/TwitterService';
import { CacheService } from '../util/CacheService';
import { CacheInterface } from '../backend/cache/cache.interface';

const twitterRegex = new RegExp(/http[s]?:\/\/t.co\/[a-zA-Z0-9]*/g);

interface StateInterface {
	dataSet: CacheInterface;
	currentPage: number;
	paginationSize: number;
	paginationId: string;
	searchCounter: number;
	timelineFlag: boolean;
}

const defaultState: StateInterface = {
	dataSet: { _id: '', posts: [] },
	currentPage: 1,
	paginationSize: 10,
	paginationId: '',
	searchCounter: 0,
	timelineFlag: false,
};

class SearchPage extends React.Component {
	state: StateInterface = defaultState; // Set default state

	// Resets the state to default values
	defaultState() {
		this.setState({
			dataSet: { _id: '', posts: [] },
			currentPage: 1,
			paginationSize: 10,
			paginationId: '',
			searchCounter: 0,
			timelineFlag: false,
		});
	}

	onSearch = async (username: string) => {
		const id = await TwitterService.getTwitterIDByUsername(username);
		if (!id) return;

		// If searching for a different user than the previous search, reset state
		if (this.state.dataSet?._id !== id) {
			this.defaultState();
		}

		await this.executeSearch(id);
	};

	executeSearch = async (userid: string, lastid?: string, maxResults?: string, recursiveFlag = false) => {
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

		// Only change cache if we receive any posts
		if (posts) {
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
		}

		// Recursively get more search results
		if (
			// getMore && // If the cache isn't up to date yet
			this.state.searchCounter <= 50 && // If we haven't surpassed the maximum search amount
			this.state.dataSet.posts.length < this.state.paginationSize * (this.state.currentPage + 9) // If the current number of posts is less than the max # of default pages
		) {
			// If the recursiveFlag is set, only execute if on the last page (to add 1 more page)
			if (recursiveFlag) {
				if (this.state.dataSet.posts.length < (this.state.currentPage + 1) * this.state.paginationSize) {
					this.setState({ searchCounter: this.state.searchCounter++ });
					await this.executeSearch(userid, this.state.paginationId);
				}
			} else {
				this.setState({ searchCounter: this.state.searchCounter++ });
				await this.executeSearch(userid, this.state.paginationId);
			}

			// Reset counter once we reach the max for the next search
		} else if (this.state.searchCounter > 50) {
			this.setState({ searchCounter: 0 });
		}
	};

	changePage(page: number) {
		// Max 500 results && if on the last page -- get more results
		if (this.state.dataSet.posts.length < 500 && page === Math.ceil(this.state.dataSet.posts.length / this.state.paginationSize)) {
			this.executeSearch(this.state.dataSet._id, this.state.paginationId, '10', true);
		}
		this.setState({ currentPage: page });
	}

	regexText(text: string) {
		const value = (text + ' ').match(twitterRegex);
		return value?.[1] || value?.[0];
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
								<Card cover={<Image src={item.image_url} />}>
									<Meta
										title={
											<a href={this.regexText(item.text)} target="_blank" rel="noreferrer">
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
