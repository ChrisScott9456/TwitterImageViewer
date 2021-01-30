import Twitter_Logo_Blue from './resources/Twitter_Logo_Blue/Twitter_Logo_Blue.svg';
import './App.css';
import SearchPage from './components/search';

function App() {
	return (
		<div className="App">
			<header className="App-header">
				<a href="/">
					<img src={Twitter_Logo_Blue} className="App-logo" alt="logo" />
				</a>
				<SearchPage />
			</header>
		</div>
	);
}

export default App;
