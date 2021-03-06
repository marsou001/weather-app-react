import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState(null);
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);  

  const { REACT_APP_WEATHER_BASE, REACT_APP_WEATHER_KEY, REACT_APP_CITIES_BASE, REACT_APP_CITIES_HOST, REACT_APP_CITIES_KEY } = process.env;
  
  const date = new Date();

  const month = date.getMonth();

  const dayOfTheWeek = date.getDate();
  const monthString = month.toString().length === 1 ? `0${month}` : month.toString();
  const year = date.getFullYear();
  
  const getDate = _ => {
    const day = date.getDay();
    const months = ["January", "February", "Mars", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    return `${days[day]} ${dayOfTheWeek} ${months[month]} ${year}`;
  }
  
  const getWeather = e => {
    e.preventDefault();        
    const url = new URL(`${REACT_APP_WEATHER_BASE}?q=${query}&APPID=${REACT_APP_WEATHER_KEY}`);
    fetch(url)
      .then(response => {
        if (response.status !== 200) {
          return response.json().then(err => {            
            const error = new Error();
            error.data = err;
            throw error;
          })
        }
        return response.json();
      })
      .then(res => setWeather(res))
      .catch(error => {
        setError(error);
        setWeather(null);
      });           
  }

  useEffect(() => {
    if (query.length >= 3) {
      fetch(`${REACT_APP_CITIES_BASE}?query=${query}&searchby=city`, {
        "method": "GET",
        "headers": {
          "x-rapidapi-host": REACT_APP_CITIES_HOST,
          "x-rapidapi-key": REACT_APP_CITIES_KEY
        }
      })
      .then(response => response.json())
      .then(res => {
        const response = res.filter(suggestion => new RegExp(`^${query}`, 'i').test(suggestion.city))
                            .filter((suggestion, i) => i < 10);
        setSuggestions(response);
      })
      .catch(err => console.error(err));
    }
  }, [query, REACT_APP_CITIES_BASE, REACT_APP_CITIES_HOST, REACT_APP_CITIES_KEY]);

  useEffect(() => {
    if (window.isSecureContext) {
      if (navigator?.geolocation) {  
        function success({ coords }) {
          const { latitude, longitude } = coords;
          const url = new URL(`${REACT_APP_WEATHER_BASE}?lat=${latitude}&lon=${longitude}&APPID=${REACT_APP_WEATHER_KEY}`);
          fetch(url)
            .then(response => response.json())
            .then(res => setWeather(res))
            .catch(err => console.error(err));
        }

        function error({ code, message }) {
          console.info(`ERROR(${code}): ${message}`)
        }

        function options() {
          return {
            timeout: 12000
          }
        }

        (function() {
          navigator.geolocation.getCurrentPosition(success, error, options);
        })(); 
      }
    } 
  }, [REACT_APP_WEATHER_BASE, REACT_APP_WEATHER_KEY])

  return (
    <main>
      <form onSubmit={getWeather}>
        <input type="text" list="cities" placeholder="Enter city" onChange={e => setQuery(e.target.value)} value={query} />
        <datalist id="cities">
          {suggestions && suggestions.map(({ city, state, country }, i) => <option key={i} value={`${city},${state},${country}`} />)}
        </datalist>
      </form>     
      {weather ? (  
        <>    
          <h1 className="city">{weather.name}, {weather.sys.country}</h1>
            <span><time dateTime={`${dayOfTheWeek}-${(monthString)}-${year}`}>{getDate()}</time></span>
          <div className="temperatureBox">
            <span className="temperature">{Math.round((weather.main.temp) - 273.15)}</span>°c
          </div>
          <div className="weatherBox">
            <span className="weather">{weather.weather[0].main}</span>
          </div>    
        </>
      ) : (
          <h1>{error ? `${error.data.cod}: ${error.data.message}` : null}</h1>
      )}    
    </main>
  );
}

export default App;
