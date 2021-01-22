import React from "react";
import countries from "./countries";
import { to } from "await-to-js";
import { http } from "../util/http";
import { AxiosRequestConfig } from "axios";
import Search from "antd/lib/input/Search";
import { TwitterTimeline } from "../interfaces/TwitterTimeline";

const twitterAuth = require('../keyfiles/twitter.json');

interface State {
  dataSet: any[];
  filteredSet: any[];
  searchValue: string;
  thing: string;
}

class SearchPage extends React.Component {
  state: State = {
    dataSet: [],
    filteredSet: [],
    searchValue: "",
    thing: ''
  }

  handleSearch = async (value: string) => {
    this.setState({ thing: value });
    this.setState({ searchValue: value }, () => this.searchForCountry());
    await this.searchTwitter(value);
  };

  searchForCountry = () => {
    this.setState((prevState: State) => {
      const filteredSet = prevState.dataSet.filter((item: string) => item.toLowerCase().match(this.state.searchValue.toLowerCase()));
      return { filteredSet };
    });
  }

  searchTwitter = async (id: string) => {
    const request: AxiosRequestConfig = {
      method: 'GET',
      url: `users/${id}/tweets?media.fields=url&expansions=attachments.media_keys`,
      headers: {
          'Authorization': 'Bearer ' + twitterAuth.bearer_token
      }
  }

    const [e, r] = await to<TwitterTimeline>(http(request));
    console.log(e || r);
    if (e) {
      this.setState({ thing: e.message });
      return;
    }

    this.setState({ thing: r });
  }

  render() {
    return (
      <div>
        <p>{this.state.thing}</p>
        <Search placeholder="Enter Twitter username" onSearch={this.handleSearch} style={{ width: 200 }} />
        
      </div>
    );
  }
}

export default SearchPage;