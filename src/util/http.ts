import Axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { to } from 'await-to-js';

export async function http(config: AxiosRequestConfig) {
    const [e, r] = await to<AxiosResponse, AxiosError>(Axios.request(config));
    
    if (e) {
        throw e;
    }

    return r.data;
}