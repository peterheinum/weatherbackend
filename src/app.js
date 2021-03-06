require('dotenv').config();
const fetch = require('node-fetch');
const express = require('express')();
const cors = require('cors')
const mapquest_key = process.env.MAPQUEST_KEY;
const mapquest_secret = process.env.MAPQUEST_SECRET;
const darksky_key = process.env.DARKSKY_KEY;
express.use(cors());
express.listen(process.env.PORT || 5000);

console.log('API ACTIVATED');

express.get('/', (req, res) => {
    let city = 'stockholm';
    res.send("yup im online yo");
})

express.get('/:location?/:unit?/', (req, res) => {
    let location = req.params.location;
    let unit = checkIfUnitExists(req);
    reportCurrentWeatherFromLocation(location, res, unit);
})

express.get('/api/currently/:location?/:unit?/', (req, res) => {
    let location = req.params.location;
    let unit = checkIfUnitExists(req);
    reportCurrentWeatherFromLocation(location, res, unit)
})

express.get('/api/forecast/:location?/:unit?/', (req, res) => {
    let location = req.params.location;
    let unit = checkIfUnitExists(req);
    reportForecastFromLocation(location, res, unit);
})

express.get('/api/raw/:location?/:unit?', (req, res) => {
    let location = req.params.location;
    let unit = checkIfUnitExists(req);
    rawDataFromCity(location, res, unit);
})

express.get('/api/24h/:location?/:unit?', (req, res) => {
    const location = req.params.location;
    let unit = checkIfUnitExists(req);
    getHourlyPrognosisFromLocation(location, res, unit);
})



function fetchLatAndLong(city) {
    return fetch(`http://www.mapquestapi.com/geocoding/v1/address?key=${mapquest_key}&location=${city}, SE`);
}

function fetchWeather(latlng, unit) {
    if (unit == "none" || unit == 'C' || unit == undefined) return fetch(`https://api.darksky.net/forecast/${darksky_key}/${latlng}?&units=si`);
    if (unit != "none") {
        return fetch(`https://api.darksky.net/forecast/${darksky_key}/${latlng}`);
    }
}


// getLatandLongFromLocation = (location) => {
//     if (location.split(',')[1] !== undefined) {
//         return location;
//     } else {
//         fetchLatAndLong(location).then(response => response.json()).then(latData => {
//             return getLatAndLngFromRes(latData);
//         })
//     }
// }

getHourlyPrognosisFromLocation = (location, res, unit) => {
    if (location.split(',')[1] !== undefined) {
        fetchWeather(location, unit).then(response => response.json()).then(weatherData => {
            let arr = [];
            for (let i = 0; i < 25; i += 3) {
                let weather = {
                    time: convertUnixToTime(weatherData.hourly.data[i].time),
                    summary: weatherData.hourly.data[i].summary,
                    temperature: weatherData.hourly.data[i].temperature,
                    apparentTemperature: weatherData.hourly.data[i].apparentTemperature,
                    windSpeed: weatherData.hourly.data[i].windSpeed,
                }
                arr.push(weather);
            }
            res.send(JSON.stringify(arr));
        });
    }
    else {
        fetchLatAndLong(location).then(response => response.json()).then(latData => {
            fetchWeather(getLatAndLngFromRes(latData), unit).then(response => response.json()).then(weatherData => {
                let arr = [];
                for (let i = 0; i < 25; i += 3) {
                    let weather = {
                        time: convertUnixToTime(weatherData.hourly.data[i].time),
                        summary: weatherData.hourly.data[i].summary,
                        temperature: weatherData.hourly.data[i].temperature,
                        apparentTemperature: weatherData.hourly.data[i].apparentTemperature,
                        windSpeed: weatherData.hourly.data[i].windSpeed,
                    }
                    arr.push(weather);
                }
                res.send(JSON.stringify(arr));
            });
        });
    }

}

rawDataFromCity = (city, res, unit) => {
    try {
        fetchLatAndLong(city).then(response => response.json()).then(latData => {
            fetchWeather(getLatAndLngFromRes(latData), unit).then(response => response.json()).then(weatherData => {
                res.send(weatherData);
            });
        });
    } catch (error) {
        let jsonError = JSON.stringify({ error: error.msg })
        res.send(jsonError);
    }
}

reportCurrentWeatherFromLocation = (location, res, unit) => {
    let weather;
    if (location.split(',')[1] != undefined) {    //This will determine if the location we sent in is a latlng or city
        fetchWeather(location, unit).then(response => response.json()).then(weatherData => {
            let sunsetTime = convertUnixToTime(weatherData.daily.data[0].sunsetTime);
            let sunriseTime = convertUnixToTime(weatherData.daily.data[0].sunriseTime);
            weather = {
                windSpeed: weatherData.currently.windSpeed,
                summary: weatherData.currently.summary,
                Temperature: weatherData.currently.temperature,
                Humidity: weatherData.currently.humidity,
                sunrise: sunriseTime,
                sunset: sunsetTime,
                icon: weatherData.currently.icon
            }
            res.send(JSON.stringify(weather))
        });
    } else {
        fetchLatAndLong(location).then(response => response.json()).then(latData => {
            fetchWeather(getLatAndLngFromRes(latData, unit), unit).then(response => response.json()).then(weatherData => {
                let sunsetTime = convertUnixToTime(weatherData.daily.data[0].sunsetTime);
                let sunriseTime = convertUnixToTime(weatherData.daily.data[0].sunriseTime);
                weather = {
                    windSpeed: weatherData.currently.windSpeed,
                    summary: weatherData.currently.summary,
                    Temperature: weatherData.currently.temperature,
                    Humidity: weatherData.currently.humidity,
                    sunrise: sunriseTime,
                    sunset: sunsetTime,
                    icon: weatherData.currently.icon
                }
                res.send(JSON.stringify(weather))
            });
        });
    }
}

reportForecastFromLocation = (city, res, unit) => {
    let report = [];
    fetchLatAndLong(city).then(response => response.json()).then(latData => {
        fetchWeather(getLatAndLngFromRes(latData), unit).then(response => response.json()).then(weatherData => {
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
                    sunset: sunsetTime,
                    icon: e.icon
                }
                number++;
                report.push(template);
            });
            res.send(JSON.stringify(report));
        });
    });
}

// HELPERS ------------------------ HELPERS \\
getLatAndLngFromRes = (res) => {
    let latLng;
    res.results.forEach(element => {
        element.locations.forEach(e => {
            latLng = `${e.latLng.lat},${e.latLng.lng}`
        });
    });
    return latLng;
}


convertUnixToTime = (unix_time) => {
    let date = new Date(unix_time * 1000);
    let hours = date.getHours();
    let minutes = "0" + date.getMinutes();
    return hours + ':' + minutes.substr(-2);
}

checkIfUnitExists = (req) => {
    let unit = req.params.unit;
    if (unit == undefined) unit = "none";
    return unit;
}