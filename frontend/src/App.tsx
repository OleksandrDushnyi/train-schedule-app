import "./App.css";

function App() {
  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Train schedule</h1>
        <p className="app__subtitle">Search and browse departures</p>
      </header>
      <main className="app__main">
        <p className="app__placeholder">
          Search, trip list, and details will show here once the API is
          connected.
        </p>
      </main>
    </div>
  );
}

export default App;
