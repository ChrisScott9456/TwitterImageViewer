import React from 'react';
import Search from 'antd/lib/input/Search';
import { Card, List, Image, Button, Row, Tooltip } from 'antd';
import { Meta } from 'antd/lib/list/Item';
import { TwitterService } from '../util/TwitterService';
import { CacheService } from '../util/CacheService';
import { CacheInterface } from '../backend/cache/cache.interface';
import { SwitcherOutlined, PlusOutlined } from '@ant-design/icons';

const twitterRegex = new RegExp(/http[s]?:\/\/t.co\/[a-zA-Z0-9]*/g);
const paginationSizeOptions = ['25', '50'];
const maxSearchAttempts = 5;

interface StateInterface {
	dataSet: CacheInterface; // The posts displayed in the grid
	currentPage: number; // Current page number
	paginationSize: number; // Total results to display per page
	paginationId: string; // The ID of the last image in the dataset used to search for more posts
	attemptCounter: number; // Counter used to prevent too many searches to find a new post w/ image to add
	searchFlag: boolean; // Flag used to prevent load more button from searching while search already executing
	closeText: boolean; // Flag to open/close tweet text boxes under images
}

const defaultState: StateInterface = {
	dataSet: { _id: '', posts: [] },
	currentPage: 1,
	paginationSize: parseInt(paginationSizeOptions[0]),
	paginationId: '',
	attemptCounter: 0,
	searchFlag: false,
	closeText: false,
};

class SearchPage extends React.Component {
	state: StateInterface = defaultState; // Set default state

	// Resets the state to default values
	defaultState() {
		this.setState(defaultState);
	}

	onSearch = async (username: string) => {
		if (!username) return;

		const id = await TwitterService.getTwitterIDByUsername(username);
		if (!id) {
			console.error('THAT USER DOES NOT EXIST!');
			return;
		}

		// If searching for a different user than the previous search, reset state
		if (this.state.dataSet?._id !== id) {
			this.defaultState();
		}

		// Set to currently searching
		this.setState({ searchFlag: true });

		await this.executeSearch(id);
	};

	executeSearch = async (userid: string, lastid?: string, maxResults?: string) => {
		// Get latest timeline information
		const timeline = await TwitterService.getTwitterTimeline(userid, maxResults || '5', lastid);

		// If issue receiving timeline
		if (!timeline) {
			console.error('FAILED TO RETRIEVE TIMELINE');
			this.setState({ searchFlag: false });
			return;
		}

		// Get cache for the current user
		const cache = await CacheService.getCache(userid);
		this.setState({ attemptCounter: this.state.attemptCounter + 1 }); // Increment attempt counter

		console.log(timeline);

		// Only extract posts and update cache if we received timeline data
		if (timeline?.data) {
			// Set paginationId and get posts from timeline
			this.setState({ paginationId: timeline.data[timeline.data.length - 1].id });
			const posts = TwitterService.extractPostsFromTimeline(timeline);

			// Only update cache if we receive any posts
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

				if (timeline?.includes) this.setState({ attemptCounter: 0 }); // Reset search counter when timeline contains images
			}
		}

		// Recursively get more search results
		if (
			lastid &&
			this.state.attemptCounter <= maxSearchAttempts && // If we haven't surpassed the maximum search attempts
			this.state.dataSet.posts.length < this.state.paginationSize * (this.state.currentPage + 1) // If the current number of posts is less than the max # of default pages
		) {
			await this.executeSearch(userid, this.state.paginationId);
		} else if (this.state.attemptCounter > maxSearchAttempts) {
			console.error('MAX SEARCH ATTEMPTS REACHED');
		}

		// Set the searchFlag to false when done searching so we can allow searching again
		this.setState({ searchFlag: false, attemptCounter: 0 });
	};

	// Helper function to determine if currently on the last page
	// pagesAway is how many pages from the last page we should check for the condition
	onLastPage(pagesAway = 0): boolean {
		return this.state.currentPage === Math.ceil(this.state.dataSet.posts.length / this.state.paginationSize) - pagesAway;
	}

	loadMore() {
		// Only execute if not already searching and currently on the last page
		if (!this.state.searchFlag && this.onLastPage()) {
			this.setState({ searchFlag: true });
			this.executeSearch(this.state.dataSet._id, this.state.paginationId, '10');
		}
	}

	getTweetURL(text: string) {
		const value = (text + ' ').match(twitterRegex);
		return value?.[1] || value?.[0];
	}

	render() {
		return (
			<div>
				<Row align="middle" justify="center" gutter={[10, 10]}>
					<Search className="search" placeholder="Enter Twitter Username" onSearch={this.onSearch} addonBefore="@" />
					{this.state.dataSet.posts.length > 0 && (this.onLastPage() || this.state.searchFlag) ? (
						<Tooltip title="Load More" placement="top">
							<Button className="button" type="primary" size="large" icon={<PlusOutlined />} loading={this.state.searchFlag} onClick={() => this.loadMore()} />
						</Tooltip>
					) : null}
					{this.state.dataSet.posts.length > 0 ? (
						<Tooltip title="Close Text" placement="top">
							<Button className="button" size="large" icon={<SwitcherOutlined />} onClick={() => this.setState({ closeText: !this.state.closeText })} />
						</Tooltip>
					) : null}
				</Row>
				{this.state.dataSet.posts.length > 0 ? (
					<List
						pagination={{
							disabled: this.state.searchFlag,
							current: this.state.currentPage,
							showSizeChanger: true,
							position: 'both',
							pageSizeOptions: paginationSizeOptions,
							pageSize: this.state.paginationSize,
							defaultPageSize: this.state.paginationSize,
							onChange: (page) => this.setState({ currentPage: page }),
							onShowSizeChange: (current, size) => this.setState({ currentPage: current, paginationSize: size.toString() }),
						}}
						grid={{ gutter: 16, column: 5 }}
						dataSource={this.state.dataSet.posts}
						renderItem={(item) => (
							<List.Item>
								<Card bodyStyle={{ display: this.state.closeText ? 'none' : '' }} cover={<Image src={item.image_url} />}>
									{!this.state.closeText ? (
										<Meta
											title={
												<a href={this.getTweetURL(item.text)} target="_blank" rel="noreferrer">
													{item.text}
												</a>
											}
										/>
									) : null}
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
