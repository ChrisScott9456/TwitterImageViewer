import express from 'express';
import Axios, { AxiosRequestConfig } from 'axios';
import { to } from 'await-to-js';
import { connectMongo } from './util/mongo';
import { TwitterAPIService } from './util/twitter';
const cors = require('cors');

const app = express();
const port = 4000;

// // Set up a whitelist and check against it:
// var whitelist = ['http://localhost:3000/', 'http://localhost:5000/'];
// var corsOptions = {
// 	origin: function (origin: any, callback: any) {
// 		if (whitelist.indexOf(origin) !== -1) {
// 			callback(null, true);
// 		} else {
// 			callback(new Error('Not allowed by CORS'));
// 		}
// 	},
// };

// app.use(cors(corsOptions));

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

app.get('/cache/:id', async (req, res) => {
	// Do thing
});
