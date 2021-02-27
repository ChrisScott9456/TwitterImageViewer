import Twitter_Logo_Blue from './resources/Twitter_Logo_Blue/Twitter_Logo_Blue.svg';
import './App.css';
import SearchPage from './components/search';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

function App() {
	return (
		<BrowserRouter>
			<div className="App">
				<header className="App-header">
					<a href="/">
						<img src={Twitter_Logo_Blue} className="App-logo" alt="logo" />
					</a>
					<Switch>
						<Route path="/:username?/:page?">
							<SearchPage />
						</Route>
					</Switch>
				</header>
			</div>
		</BrowserRouter>
	);
}

export default App;
