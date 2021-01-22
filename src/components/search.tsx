import React from "react";
import { to } from "await-to-js";
import { http } from "../util/http";
import { AxiosRequestConfig } from "axios";
import Search from "antd/lib/input/Search";
import { TwitterTimeline } from "../interfaces/TwitterTimeline";
import { Card, List, Image } from "antd";
import { TwitterPost } from "../interfaces/TwitterPost";
import Item, { Meta } from "antd/lib/list/Item";
import { TwitterUser } from "../interfaces/TwitterUser";

const twitterAuth = require('../keyfiles/twitter.json');
const twitterRegex = new RegExp(/https:\/\/t.co\/.*/g);

interface State {
  dataSet: TwitterPost[];
  searchValue: string;
  thing: string;
}

class SearchPage extends React.Component {
  state: State = {
    dataSet: [],
    searchValue: "",
    thing: ''
  }

  timelineToPosts = (arr: TwitterTimeline) => {
    const posts: TwitterPost[] = arr.data.map((data) => {
      return {
        id: data.id,
        text: data.text,
        image_url: arr.includes.media.find((media) => {
          if (!data.attachments) return null;

          return data?.attachments.media_keys.find((key) => {
            return media.media_key === key
          })
        })?.url
      }
    });

    this.setState({ dataSet: posts.filter(el => el.image_url) });
  }

  performSearch = async (username: string) => {
    const id = await this.getTwitterIDByUsername(username);
    await this.searchTwitter(id);
  }

  getTwitterIDByUsername = async (username: string) => {
    const request: AxiosRequestConfig = {
      method: 'GET',
      url: `users/by/username/${username}?`,
      headers: {
          'Authorization': 'Bearer ' + twitterAuth.bearer_token
      }
  }

    const [e, r] = await to<TwitterUser>(http(request));
    if (e || !r) {
      return '';
    }

    return r?.data?.id;
  }

  searchTwitter = async (id: string) => {
    const request: AxiosRequestConfig = {
      method: 'GET',
      url: `users/${id}/tweets?max_results=100&media.fields=url&expansions=attachments.media_keys`,
      headers: {
          'Authorization': 'Bearer ' + twitterAuth.bearer_token
      }
  }

    const [e, r] = await to<TwitterTimeline>(http(request));
    if (e || !r) {
      return;
    }

    this.timelineToPosts(r);
  }

  render() {
    return (
      <div>
        <Search className="search" placeholder="Enter Twitter Username" onSearch={this.performSearch} addonBefore="@"/>
        {this.state.dataSet.length > 0 ? (<List
          pagination={{position: "both"}}
          grid={{ gutter: 16, column: 5 }}
          dataSource={this.state.dataSet}
          renderItem={item => (
            <List.Item>
              <Card hoverable cover={<Image src={item.image_url} />}>
                  <Meta title={
                    <a href={item.text.match(twitterRegex)?.[0]} target="_blank" rel="noreferrer">
                      {item.text}
                    </a>
                  }/>
              </Card>
            </List.Item>
          )}
        />) : null}
      </div>
    );
  }
}

export default SearchPage;