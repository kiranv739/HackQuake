import React, { useState, useEffect } from "react";
import "../styles/TrafficDelay.css";  // ✅ Corrected CSS import

const openWeatherApiKey = "e24d0eed9f1b82bdea9b79b3937937a2";
const googleMapsApiKey = "AIzaSyDhnjqZgK29fNWtIa23fFR5EUJOM-uiv4c";

const TrafficDelayCalculator = () => {
    const [map, setMap] = useState(null);
    const [directionsService, setDirectionsService] = useState(null);
    const [directionsRenderer, setDirectionsRenderer] = useState(null);
    const [source, setSource] = useState("");
    const [destination, setDestination] = useState("");
    const [normalDuration, setNormalDuration] = useState("-");
    const [trafficDuration, setTrafficDuration] = useState("-");
    const [trafficDelay, setTrafficDelay] = useState("-");
    const [weatherInfo, setWeatherInfo] = useState("-");
    const [weatherDelay, setWeatherDelay] = useState("-");
    const [totalDelay, setTotalDelay] = useState("-");

    useEffect(() => {
        const loadGoogleMapsScript = () => {
            if (!window.google) {
                const script = document.createElement("script");
                script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`;
                script.async = true;
                script.defer = true;
                script.onload = initializeMap;
                document.body.appendChild(script);
            } else {
                initializeMap();
            }
        };

        const initializeMap = () => {
            const mapInstance = new window.google.maps.Map(document.getElementById("map"), {
                center: { lat: 12.9716, lng: 77.5946 },
                zoom: 12,
            });

            setMap(mapInstance);
            setDirectionsService(new window.google.maps.DirectionsService());
            setDirectionsRenderer(new window.google.maps.DirectionsRenderer({ map: mapInstance }));
        };

        loadGoogleMapsScript();
    }, []);

    const fetchWeather = async (latitude, longitude) => {
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${openWeatherApiKey}&units=metric`
            );
            const data = await response.json();

            if (!data.weather || !data.weather[0]) throw new Error("Invalid weather data received");

            const weatherDescription = data.weather[0].description;
            const temperature = data.main.temp;
            setWeatherInfo(`${weatherDescription}, ${temperature}°C`);

            let delay = 0;
            if (weatherDescription.includes("rain")) delay = 10;
            else if (weatherDescription.includes("snow")) delay = 20;
            else if (weatherDescription.includes("fog")) delay = 15;

            setWeatherDelay(`${delay} minutes`);
            return delay;
        } catch (error) {
            console.error("Error fetching weather data:", error);
            setWeatherInfo("Weather data unavailable");
            setWeatherDelay("0 minutes");
            return 0;
        }
    };

    const calculateTotalDelay = () => {
        if (!source || !destination) {
            alert("Please enter both source and destination.");
            return;
        }

        const request = {
            origin: source,
            destination: destination,
            travelMode: "DRIVING",
            drivingOptions: { departureTime: new Date() },
        };

        directionsService.route(request, async (result, status) => {
            if (status === "OK") {
                directionsRenderer.setDirections(result);
                const route = result.routes[0].legs[0];

                setNormalDuration(route.duration.text);
                setTrafficDuration(route.duration_in_traffic.text);

                const normalSeconds = route.duration.value;
                const trafficSeconds = route.duration_in_traffic.value;
                const trafficDelayMinutes = Math.round((trafficSeconds - normalSeconds) / 60);

                setTrafficDelay(`${trafficDelayMinutes} minutes`);

                const destinationLat = route.end_location.lat();
                const destinationLng = route.end_location.lng();
                const weatherDelayMinutes = await fetchWeather(destinationLat, destinationLng);

                setTotalDelay(`${trafficDelayMinutes + weatherDelayMinutes} minutes`);
            } else {
                console.error("Error fetching directions:", status);
                alert("Error fetching route. Please check the addresses and try again.");
            }
        });
    };

    return (
        <div className="container">
            <h1>Traffic and Weather Delay Calculator</h1>
            <div className="input-form">
                <input type="text" placeholder="Enter source address" value={source} onChange={(e) => setSource(e.target.value)} />
                <input type="text" placeholder="Enter destination address" value={destination} onChange={(e) => setDestination(e.target.value)} />
                <button onClick={calculateTotalDelay}>Calculate Total Delay</button>
            </div>
            <div id="map"></div>
            <div className="result">
                <p><strong>Normal Duration:</strong> {normalDuration}</p>
                <p><strong>Traffic Duration:</strong> {trafficDuration}</p>
                <p><strong>Traffic Delay:</strong> {trafficDelay}</p>
                <p><strong>Weather Condition:</strong> {weatherInfo}</p>
                <p><strong>Weather Delay:</strong> {weatherDelay}</p>
                <p><strong>Total Delay:</strong> {totalDelay}</p>
            </div>
        </div>
    );
};

export default TrafficDelayCalculator;  // ✅ Fixed component export
