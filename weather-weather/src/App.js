import React, { useState } from "react";
import Header from "./components/Header";
import CurrentLocation from "./components/CurrentLocation";
import Footer from "./components/Footer"; // Import the Footer component
import "./App.css"; // Ensure you import your CSS file


function getWeatherIcon(wmoCode) {
  const icons = new Map([
    [[0], "☀️"],
    [[1], "🌤"],
    [[2], "⛅️"],
    [[3], "☁️"],
    [[45, 48], "🌫"],
    [[51, 56, 61, 66, 80], "🌦"],
    [[53, 55, 63, 65, 57, 67, 81, 82], "🌧"],
    [[71, 73, 75, 77, 85, 86], "🌨"],
    [[95], "🌩"],
    [[96, 99], "⛈"],
  ]);

  const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
  if (!arr) return "NOT FOUND";
  return icons.get(arr);
}

function convertToFlag(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());

  return String.fromCodePoint(...codePoints);
}

function formatDay(dateStr) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
  }).format(new Date(dateStr));
}

function App() {
  const [location, setLocation] = useState("lisbon");
  const [isLoading, setIsLoading] = useState(false);
  const [displayLocation, setDisplayLocation] = useState("");
  const [weather, setWeather] = useState({});
  const [hourlyWeather, setHourlyWeather] = useState([]);

  async function fetchWeather() {
    try {
      setIsLoading(true);

      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${location}`
      );
      const geoData = await geoRes.json();
      console.log(geoData);

      if (!geoData.results) throw new Error("Location not found");

      const { latitude, longitude, timezone, name, country_code } =
        geoData.results.at(0);

      setDisplayLocation(`${name} ${convertToFlag(country_code)}`);

      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min&hourly=temperature_2m,weathercode`
      );
      const weatherData = await weatherRes.json();

      setWeather(weatherData.daily);
      setHourlyWeather(weatherData.hourly);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="app">
      <Header location={location} setLocation={setLocation} fetchWeather={fetchWeather} />
      <CurrentLocation />
      <div className="search_city">
        <input
          type="text"
          placeholder="Search for location..."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <button onClick={fetchWeather}>Get weather</button>
        {isLoading && <p className="loader">Loading...</p>}
      </div>
      {weather.weathercode && (
        <Weather weather={weather} location={displayLocation} hourlyWeather={hourlyWeather} />
      )}
      <Footer /> {/* Add the Footer component */}
    </div>
  );
}

export default App;

function Weather({ weather, location, hourlyWeather }) {
  const {
    temperature_2m_max: max,
    temperature_2m_min: min,
    time: dates,
    weathercode: codes,
  } = weather;

  return (
    <div>
      <h2>Weather {location}</h2>
      <ul className="weather">
        {dates.map((date, i) => (
          <Day
            date={date}
            max={max.at(i)}
            min={min.at(i)}
            code={codes.at(i)}
            key={date}
            isToday={i === 0}
          />
        ))}
      </ul>
      <HourlyWeather hours={hourlyWeather.time.map((time, i) => ({
        time,
        temperature: hourlyWeather.temperature_2m[i],
        description: getWeatherIcon(hourlyWeather.weathercode[i]),
      }))} />
     
    </div>
  );
}

function Day({ date, max, min, code, isToday }) {
  return (
    <li className="day">
      <span className="large-icon">{getWeatherIcon(code)}</span>
      <p>{isToday ? "Today" : formatDay(date)}</p>
      <p>
        {Math.floor(min)}&deg; &mdash; <strong>{Math.ceil(max)}&deg;</strong>
      </p>
    </li>
  );
}

function HourlyWeather({ hours }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animationClass, setAnimationClass] = useState("fade-in");

  const handleNext = () => {
    setAnimationClass("fade-out");
    setTimeout(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === hours.length - 1 ? 0 : prevIndex + 1
      );
      setAnimationClass("fade-in");
    }, 500); // Match this duration to your CSS transition time
  };

  const handlePrevious = () => {
    setAnimationClass("fade-out");
    setTimeout(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === 0 ? hours.length - 1 : prevIndex - 1
      );
      setAnimationClass("fade-in");
    }, 500); // Match this duration to your CSS transition time
  };

  return (
    <div className="hourly-weather" >
      <div className={`weather-item ${animationClass}`}>
        <h3>{hours[currentIndex].time}</h3>
        <p>{hours[currentIndex].temperature}°</p>
        <p>{hours[currentIndex].description}</p>
      </div>
      <button onClick={handlePrevious}>Previous</button>
      <button onClick={handleNext}>Next</button>
    </div>
  );
}
