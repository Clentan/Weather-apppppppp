import React, { useEffect, useState } from 'react';

export default function CurrentLocation() {
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [fahrenheit, setFahrenheit] = useState(null);
    const [temperatureUnit, setTemperatureUnit] = useState('C'); // 'C' for Celsius, 'F' for Fahrenheit

    useEffect(() => {
        async function fetchCurrentLocation() {
            if (navigator.geolocation.getCurrentPosition) {
                navigator.geolocation.getCurrentPosition(async (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    const appid = "6a4306a0f2c73c28dc5c3bbf739e87d0";

                    try {
                        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${appid}&units=metric`);
                        const data = await response.json();
                       
                        setLocation(data);
                        setIsLoading(false);
                        
                        // Save weather data to localStorage
                        saveToLocalStorage(data);

                        // Calculate and set temperature in Fahrenheit
                        calculate(data);

                    } catch (error) {
                        setError('Error fetching the location data.');
                        setIsLoading(false);
                        console.error('Error fetching the location data:', error);
                    }
                }, () => {
                    alert('No location detected 😔');
                    loadFromLocalStorage();
                });
            } else {
                alert('Geolocation is not supported by this browser.');
                loadFromLocalStorage();
            }
        }

        fetchCurrentLocation();
    }, []);

    function calculate(location) {
        const tempCelsius = location.main.temp;
        const tempFahrenheit = (tempCelsius * 1.8) + 32;
        setFahrenheit(tempFahrenheit); // Store Fahrenheit temperature
        // Optionally, you could store Celsius as well if needed
    }
    
    function saveToLocalStorage(data) {
        const weatherData = {
            location: data,
            timestamp: Date.now(),
        };
        localStorage.setItem('currentWeather', JSON.stringify(weatherData));
    }

    function loadFromLocalStorage() {
        const cachedData = localStorage.getItem('currentWeather');
        if (cachedData) {
            const { location, timestamp } = JSON.parse(cachedData);

            // Use the cached data if it's less than 6 hours old
            if (Date.now() - timestamp < 6 * 60 * 60 * 1000) {
                setLocation(location);

                // Calculate and set temperature in Fahrenheit
                calculate(location);

            } else {
                setError('Cached data is too old. Please connect to the internet to get the latest weather information.');
            }
        } else {
            setError('No cached data available. Please connect to the internet.');
        }
        setIsLoading(false);
    }

    function toggleTemperatureUnit() {
        setTemperatureUnit((prevUnit) => (prevUnit === 'C' ? 'F' : 'C'));
        //using letters tp print what is needed
    }

    // Determine the temperature to display based on the selected unit
    const displayTemperature = temperatureUnit === 'C' 
        ? location?.main.temp
        : fahrenheit;

    return (
        <div>
            {isLoading ? (
                <h1>Loading...</h1>
            ) : error ? (
                <h1>{error}</h1>
            ) : (
                location && (
                    <>
                        <h1 className='current'>Your Current Location: {location.name}</h1>
                        <ul className="Current">
                            <h3>Today's Weather</h3>
                            <img src={`https://openweathermap.org/img/wn/${location.weather[0].icon}.png`} alt={location.weather[0].description} />
                            <li>Location: {location.name}</li>
                            <li>Temperature: {displayTemperature}°{temperatureUnit}</li>
                            <li>Weather: {location.weather[0].description}</li>
                            <li>Humidity: {location.main.humidity}%</li>
                            <li>Wind Speed: {location.wind.speed} m/s</li>
                            <button 
                        className='change'
                        onClick={toggleTemperatureUnit}>
                            Switch to {temperatureUnit === 'C' ? 'Fahrenheit' : 'Celsius'}
                        </button>
                        </ul>
                       
                    </>
                )
            )}
        </div>
    );
}
