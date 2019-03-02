require('dotenv').config();
const fetch = require('node-fetch');
const express = require('express')();
const mapquest_key = process.env.MAPQUEST_KEY;
const mapquest_secret = process.env.MAPQUEST_SECRET;
const darksky_key = process.env.DARKSKY_KEY;

express.get('/test', (req, res) => {
    res.send('Hola chica');
})

express.listen(3000);
console.log("listening on port 3000");

express.get('/api/:city', (req, res) => {
    let city = req.param('city');
    reportWeatherFromCity(city, res)
})

function reportWeatherFromCity(city, res) {
    if(!checkIfStringContainsForbiddenSigns(city)){
        let currentweather;
        fetchLatAndLong(city).then(response => response.json()).then(latData => {
            fetchWeather(getLatAndLngFromRes(latData)).then(response => response.json()).then(weatherData => {
                currentweather = `${weatherData.currently.summary}, ${weatherData.currently.temperature}°C`;
                res.send(currentweather);
            });
        });
    }
    else {
        res.send('Forbidden: City cannot contain å ä ö');
    }
}

function checkIfStringContainsForbiddenSigns(string){
    let strArr = [...string];
    strArr.forEach(letter => {
        if(letter.toLowerCase() == 'å' || letter.toLowerCase() == 'ä' || letter.toLowerCase() == 'ö') {
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