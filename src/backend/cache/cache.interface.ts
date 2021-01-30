import { Document } from 'mongoose';
import { TwitterPost } from '../interfaces/TwitterPost';

export interface CacheInterface extends CacheDocInterface {
	_id: string;
}

interface CacheDocInterface {
	posts: TwitterPost[];
}

export interface CacheDocument extends Document, CacheDocInterface {}
