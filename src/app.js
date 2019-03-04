require('dotenv').config();
const fetch = require('node-fetch');
const express = require('express')();
const mapquest_key = process.env.MAPQUEST_KEY;
const mapquest_secret = process.env.MAPQUEST_SECRET;
const darksky_key = process.env.DARKSKY_KEY;
const port = process.env.PORT;
express.listen(port);
// express.listen(3000);
// console.log('3000 active');

express.get('/help', (req, res) => {
    res.send('yelp');
})

express.get('/', (req, res) => {
    let city = 'stockholm';
    reportWeatherFromCity(city, res)
})
express.get('/api/currently/:city/:unit', (req, res) => {
    let city = req.param('city');
    let unit = req.param('unit');
    if (!checkIfStringContainsForbiddenSigns(city)) {
        reportCurrentWeatherFromCity(city, res)
    }
    else {
        res.send('Forbidden: City cannot contain å ä ö');
    }
})

express.get('/api/forecast/:city/:unit', (req, res) => {
    let city = req.param('city');
    let unit = req.param('unit');
    reportForecastFromCity(city, res);
})

express.get('/api/raw/:city/:unit', (req, res) => {
    let city = req.param('city');
    let unit = req.param('unit');
    rawDataFromCity(city, res);
})


function rawDataFromCity(city, res){
    try {
        fetchLatAndLong(city).then(response => response.json()).then(latData => {
            fetchWeather(getLatAndLngFromRes(latData)).then(response => response.json()).then(weatherData => {
                res.send(weatherData);
            });
        });
    } catch (error) {
        let jsonError = JSON.stringify({ error: error.msg })
        res.send(jsonError);
    }
}


function reportCurrentWeatherFromCity(city, res) {
    let weather;
    let currentweather;
    try {
        fetchLatAndLong(city).then(response => response.json()).then(latData => {
            fetchWeather(getLatAndLngFromRes(latData)).then(response => response.json()).then(weatherData => {
                let sunsetTime = convertUnixToTime(weatherData.daily.data[0].sunsetTime);
                let sunriseTime = convertUnixToTime(weatherData.daily.data[0].sunriseTime);
                weather = {
                    windSpeed: weatherData.currently.windSpeed,
                    summary: weatherData.currently.summary,
                    Temperature: weatherData.currently.temperature,
                    Humidity: weatherData.currently.humidity,
                    sunrise: sunriseTime,
                    sunset: sunsetTime
                }
                res.send(JSON.stringify(weather))
            });
        });
    } catch (error) {
        let jsonError = JSON.stringify({ error: error.msg })
        res.send(jsonError);
    }
}

function reportForecastFromCity(city, res) {
    console.log("hello");
    let report = [];
    fetchLatAndLong(city).then(response => response.json()).then(latData => {
        fetchWeather(getLatAndLngFromRes(latData)).then(response => response.json()).then(weatherData => {
            let sunsetTime = convertUnixToTime(weatherData.daily.data[0].sunsetTime);
            let sunriseTime = convertUnixToTime(weatherData.daily.data[0].sunriseTime);
            let number = 0;
            weatherData.daily.data.forEach(e => {
                let template = {
                    dayNr: number,
                    windSpeed: e.windSpeed,
                    summary: e.summary,
                    temperatureMin: e.temperatureMin,
                    temperatureMax: e.temperatureMax,
                    humidity: weatherData.currently.humidity,
                    apparentTemperatureMin: e.apparentTemperatureMin,
                    apparentTemperatureMax: e.apparentTemperatureMax,
                    sunrise: sunriseTime,
                    sunset: sunsetTime
                }
                number++;
                report.push(template);
            });
            res.send(JSON.stringify(report));
        });
    });
}

function checkIfStringContainsForbiddenSigns(string) {
    let strArr = [...string];
    strArr.forEach(letter => {
        if (letter.toLowerCase() == 'å' || letter.toLowerCase() == 'ä' || letter.toLowerCase() == 'ö') {
            return true;
        }
    });
    return false;
}

function getLatAndLngFromRes(res) {
    let latLng;
    res.results.forEach(element => {
        element.locations.forEach(e => {
            latLng = `${e.latLng.lat},${e.latLng.lng}`
        });
    });
    return latLng;
}

function fetchLatAndLong(city) {
    return fetch(`http://www.mapquestapi.com/geocoding/v1/address?key=${mapquest_key}&location=${city}, SE`);
}

function fetchWeather(latlng) {
    return fetch(`https://api.darksky.net/forecast/${darksky_key}/${latlng}?lang=sv&units=si`);
}

function convertUnixToTime(unix_time) {
    let date = new Date(unix_time * 1000);
    let hours = date.getHours();
    let minutes = "0" + date.getMinutes();
    return hours + ':' + minutes.substr(-2);
}