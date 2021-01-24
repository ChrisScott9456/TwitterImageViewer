import express from 'express';
import Axios, { AxiosRequestConfig } from 'axios';
import { to } from 'await-to-js';
import { connectMongo } from './util/mongo';
import { TwitterService } from './util/twitter';

const app = express();
const port = 4000;

app.listen(port, async () => {
	console.log(`Example app listening at http://localhost:${port}`);
	await connectMongo();
});

app.get('/', (req, res) => {
	res.send('Hello World!');
});

app.get('/getTwitterTimeline/:userid/:maxResults/:lastid', async (req, res) => {
	const response = await TwitterService.getTwitterTimeline(req.params.userid, req.params.maxResults, req.params.lastid);
	res.send(response);
});

app.get('/cache/:id', async (req, res) => {
	// Do thing
});
