import React from 'react';
import Search from 'antd/lib/input/Search';
import { Card, List, Image, Button, Row, Tooltip, Alert, Divider } from 'antd';
import { Meta } from 'antd/lib/list/Item';
import { TwitterService } from '../util/TwitterService';
import { CacheService } from '../util/CacheService';
import { CacheInterface } from '../backend/cache/cache.interface';
import { SwitcherOutlined, PlusOutlined, LeftOutlined, RightOutlined, CloseOutlined } from '@ant-design/icons';
import { notify } from '../util/notification';
import Carousel from 'nuka-carousel';
import ReactModal from 'react-modal';
import { to } from 'await-to-js';

const twitterRegex = new RegExp(/http[s]?:\/\/t.co\/[a-zA-Z0-9]*/g);
const paginationSizeOptions = ['25', '50'];
const maxSearchAttempts = 5;
const maxLoadMoreAttempts = 3;

interface StateInterface {
	rowCount: number; // Number of images to display per row (for mobile users)
	searchString: string; // The username string of the search
	dataSet: CacheInterface; // The posts displayed in the grid
	currentPage: number; // Current page number
	paginationSize: number; // Total results to display per page
	paginationId: string; // The ID of the last image in the dataset used to search for more posts
	attemptCounter: number; // Counter used to prevent too many searches to find a new post w/ image to add
	searchFlag: boolean; // Flag used to prevent load more button from searching while search already executing
	closeText: boolean; // Flag to open/close tweet text boxes under images (default true for mobile users)
	inputError: boolean; // Flag to show error if user inputs wrong username format
	loadMoreAttempts: number; // Total number of times a user can click the Load More button and get an error before the button disappears
	imageModal: string[]; // Image urls to display in modal
}

const defaultState: StateInterface = {
	rowCount: 5,
	searchString: '',
	dataSet: { _id: '', posts: [] },
	currentPage: 1,
	paginationSize: parseInt(paginationSizeOptions[0]),
	paginationId: '',
	attemptCounter: 0,
	searchFlag: false,
	closeText: false,
	inputError: false,
	loadMoreAttempts: 0,
	imageModal: [],
};

class SearchPage extends React.Component {
	state: StateInterface = defaultState; // Set default state

	// Resets the state to default values
	defaultState() {
		this.setState(defaultState);
		this.setMobile();
	}

	setMobile() {
		if (window.matchMedia('(max-width: 768px)').matches) {
			this.setState({ rowCount: 2, closeText: true });
		}
	}

	onSearch = async (username: string) => {
		if (!username) return;

		const id = await TwitterService.getTwitterIDByUsername(username);
		if (!id) {
			notify('THAT USER DOES NOT EXIST!');
			return;
		}

		// If searching for a different user than the previous search, reset state
		if (this.state.dataSet?._id !== id) {
			this.defaultState();
		} else {
			return; // Do not perform search if we've already searched for the current username
		}

		// Set to currently searching
		this.setState({ searchString: username });
		this.setState({ searchFlag: true });

		await this.executeSearch(id);

		// Notify when initial search doesn't have any results to show
		if (this.state.dataSet?.posts?.length < 1) {
			notify('COULD NOT FIND ANY IMAGES FROM THE USER: @' + username);
		}
	};

	executeSearch = async (userid: string, lastid?: string, maxResults?: string) => {
		// Get latest timeline information
		const timeline = await TwitterService.getTwitterTimeline(userid, maxResults || '5', lastid);

		// If issue receiving timeline
		if (!timeline) {
			notify('FAILED TO RETRIEVE TIMELINE');
			this.setState({ searchFlag: false });
			return;
		}

		// If Twitter response contains an error
		if (timeline?.errors && timeline?.errors?.length > 0) {
			notify('TWITTER ERROR', timeline.errors[0].detail);
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
				const [cacheError, cacheSuccess] = await to(CacheService.insertCacheDocument(newCache));
				if (!cacheSuccess || cacheError) console.error(cacheError.message || 'FAILED TO UPDATE CACHE WITH LATEST POSTS');

				// Set lastid to the last id of the cache
				if (!getMore) {
					this.setState({ paginationId: newCache.posts[newCache.posts.length - 1].id });
				}

				if (timeline?.includes) this.setState({ attemptCounter: 0 }); // Reset search counter when timeline contains images
			}
		}

		// If no results received, retry one time with larger max_results set
		if (!timeline?.data && timeline?.meta?.result_count === 0 && this.state.attemptCounter <= maxSearchAttempts) {
			this.setState({ attemptCounter: maxSearchAttempts + 1 }); // Set to maxSearchAttempts so it only executes once
			const newMaxResults = maxResults && parseInt(maxResults) + 5 > 100 ? `${parseInt(maxResults) + 5}` : '15'; // Current maxResults + 5 (if > 100) or default to 10 (initial is 5 so we just double it)
			this.executeSearch(userid, this.state.paginationId, newMaxResults);
			return;
		}

		// Recursively get more search results
		if (
			lastid &&
			this.state.attemptCounter <= maxSearchAttempts && // If we haven't surpassed the maximum search attempts
			this.state.dataSet.posts.length < this.state.paginationSize * (this.state.currentPage + 1) // If the current number of posts is less than the max # of default pages
		) {
			await this.executeSearch(userid, this.state.paginationId);
		} else if (this.state.attemptCounter > maxSearchAttempts) {
			notify('MAX SEARCH ATTEMPTS REACHED', 'If clicking the Load More button causes this error again, Twitter will not return any more results.', 10);
			this.setState({ loadMoreAttempts: this.state.loadMoreAttempts + 1 });
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
		if (!this.state.searchFlag && this.onLastPage()) {
			// Only execute if not already searching and currently on the last page
			this.setState({ searchFlag: true });
			this.executeSearch(this.state.dataSet._id, this.state.paginationId, '10');
		}
	}

	// Gets all urls within tweet text and turns them into clickable links
	getTweetURL(text: string): JSX.Element {
		const value = (text + ' ').match(twitterRegex);
		text = text.replaceAll(twitterRegex, ' _TWITTERREGEXSTRINGTEMPLATE_ ');

		let splitText: any[] = text.split(' ');

		splitText = splitText.map((el) => {
			if (el === '_TWITTERREGEXSTRINGTEMPLATE_') {
				const url = value.shift() || '';
				return (
					<a key={url} href={url} target="_blank" rel="noreferrer">
						{url}
					</a>
				);
			}

			return el;
		});

		return <span className="cardBody">{splitText.map((el) => (typeof el === 'string' ? `${el} ` : el))}</span>;
	}

	trimWhitespace(e: React.ChangeEvent<HTMLInputElement>) {
		if (this.validateUsername(e.target.value.trim())) {
			this.setState({ inputError: false, searchString: e.target.value.trim() });
		} else {
			this.setState({ inputError: true });
		}
	}

	// Make sure username only contains letters, numbers, or underscore
	validateUsername(username: string) {
		return username ? /^\w+$/.test(username) : true;
	}

	render() {
		return (
			<div>
				{this.state.inputError ? (
					<Divider>
						<Alert className="search" style={{ textAlign: 'left' }} message="Only letters, numbers, and underscores are allowed in a Twitter username!" type="error" showIcon />
					</Divider>
				) : null}
				<Row align="middle" justify="center" gutter={[10, 10]}>
					<Search className="search" placeholder="Enter Twitter Username" value={this.state.searchString} onChange={(e) => this.trimWhitespace(e)} onSearch={(value) => this.onSearch(value.trim())} addonBefore="@" />
					{this.state.dataSet.posts.length > 0 && (this.onLastPage() || this.state.searchFlag) && this.state.loadMoreAttempts < maxLoadMoreAttempts ? (
						<Tooltip title="Load More" placement="top">
							<Button className="button" type="primary" size="large" icon={<PlusOutlined />} loading={this.state.searchFlag} onClick={() => this.loadMore()} />
						</Tooltip>
					) : null}
					{this.state.dataSet.posts.length > 0 ? (
						<Tooltip title={this.state.closeText ? 'Open Text' : 'Close Text'} placement="top">
							<Button className="button" size="large" icon={<SwitcherOutlined />} ghost={this.state.closeText} onClick={() => this.setState({ closeText: !this.state.closeText })} />
						</Tooltip>
					) : null}
				</Row>
				{this.state.paginationId ? (
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
						grid={{ gutter: 16, column: this.state.rowCount }}
						dataSource={this.state.dataSet.posts}
						renderItem={(item) => (
							<List.Item>
								<Card
									bodyStyle={{ display: this.state.closeText ? 'none' : '' }}
									cover={
										<List
											grid={{ column: item.image_urls.length === 1 ? 1 : 2 }}
											dataSource={item?.image_urls}
											renderItem={(image) => <Image src={image} preview={false} onClick={(e) => this.setState({ imageModal: item.image_urls })} style={{ cursor: 'pointer' }} />}
										/>
									}
								>
									{!this.state.closeText ? <Meta title={this.getTweetURL(item?.text)} /> : null}
								</Card>
							</List.Item>
						)}
					/>
				) : null}
				<ReactModal className="modalClass" overlayClassName="modalOverlayClass" isOpen={this.state.imageModal.length > 0} onRequestClose={(e) => this.setState({ imageModal: [] })}>
					<div style={{ textAlign: 'left' }}>
						<Button className="button" onClick={(e) => this.setState({ imageModal: [] })}>
							<CloseOutlined />
						</Button>
					</div>
					<Carousel
						renderCenterLeftControls={({ previousSlide }) => (
							<Button className="button" onClick={previousSlide}>
								<LeftOutlined />
							</Button>
						)}
						renderCenterRightControls={({ nextSlide }) => (
							<Button className="button" onClick={nextSlide}>
								<RightOutlined />
							</Button>
						)}
					>
						{this.state.imageModal.map((el) => (
							<Image src={el} preview={false} style={{ maxHeight: '90vh' }} />
						))}
					</Carousel>
				</ReactModal>
			</div>
		);
	}
}

export default SearchPage;
