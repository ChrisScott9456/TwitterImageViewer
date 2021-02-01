import express from 'express';
import Axios, { AxiosRequestConfig } from 'axios';
import { to } from 'await-to-js';
import { connectMongo } from './util/mongo';
import { TwitterAPIService } from './util/twitter';
import { CacheAPIService } from './cache/cache';
import { TwitterPost } from './interfaces/TwitterPost';
import bodyParser from 'body-parser';

const app = express();
const port = 4000;

app.use(bodyParser.json({ limit: '50mb' }));

app.listen(port, async () => {
	console.log(`Example app listening at http://localhost:${port}`);
	await connectMongo();
});

app.get('/', (req, res) => {
	res.send('Hello World!');
});

app.get('/getTwitterIDByUsername/:username', async (req, res) => {
	const [e, r] = await to(TwitterAPIService.getTwitterIDByUsername(req.params.username));
	res.send(r || e);
});

app.get('/getTwitterTimeline/:userid/:maxResults/:lastid?', async (req, res) => {
	const [e, r] = await to(TwitterAPIService.getTwitterTimeline(req.params.userid, req.params.maxResults, req.params.lastid));
	res.send(r || e);
});

app.post('/insertCacheDocument', async (req, res) => {
	const [e, r] = await to(CacheAPIService.upsertCacheDocument(req.body._id, req.body.posts));
	res.send(r || e);
});

app.get('/getCacheDocument/:userid', async (req, res) => {
	const [e, r] = await to(CacheAPIService.getCacheDocument(req.params.userid));
	res.send(r || e);
});
