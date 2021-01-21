import express from 'express';
import Axios, { AxiosRequestConfig } from 'axios';
import { to } from 'await-to-js';

import * as twitter from '../keyfiles/twitter.json';

const app = express();
const port = 3000;

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});

app.get('/', (req, res) => {
    res.send('Hello World!')
});

app.get('/twitter/:id', async (req, res) => {
    const request: AxiosRequestConfig = {
        method: 'GET',
        url: `https://api.twitter.com/2/users/${req.params.id}/tweets?media.fields=url&expansions=attachments.media_keys`,
        headers: {
            'Authorization': 'Bearer ' + twitter.bearer_token
        }
    }

    const [e, r] = await to(Axios.request(request));
    delete r.request;
    
    res.send(e || r);
});