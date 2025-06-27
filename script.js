// API Keys
const OPENWEATHER_API_KEY = "a0e78d3b449db7059df0a38abd3952f8";
const MAPBOX_API_KEY = "pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw";

// DOM Elements
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const closeSearchBtn = document.getElementById('close-search');
const useLocationBtn = document.getElementById('use-location');

// Global variables
let map;
let marker;
let currentLocation = { lat: 0, lon: 0 };

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
  initMap();
  getLocation();
  setupEventListeners();
});

// Set up event listeners
function setupEventListeners() {
  // Search functionality
  searchInput.addEventListener('input', debounce(handleSearch, 300));
  closeSearchBtn.addEventListener('click', clearSearch);
  useLocationBtn.addEventListener('click', getLocation);
  
  // Tab navigation
  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', function() {
      document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      // You could add functionality to show different tabs here
    });
  });
}

// Initialize the map
function initMap() {
  map = L.map('map').setView([0, 0], 2);
  L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">MapBox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: MAPBOX_API_KEY
  }).addTo(map);
}

// Get user's current location
function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        currentLocation.lat = position.coords.latitude;
        currentLocation.lon = position.coords.longitude;
        updateWeatherData(currentLocation.lat, currentLocation.lon);
        updateMap(position.coords.latitude, position.coords.longitude);
      },
      error => {
        console.error("Error getting location:", error);
        // Default to London if location access is denied
        currentLocation.lat = 51.5074;
        currentLocation.lon = -0.1278;
        updateWeatherData(currentLocation.lat, currentLocation.lon);
        updateMap(currentLocation.lat, currentLocation.lon);
      }
    );
  } else {
    alert("Geolocation is not supported by this browser.");
  }
}

// Replace your initMap function with this:
function initMap() {
  // Small delay to ensure container is rendered
  setTimeout(() => {
    if (!map) {
      map = L.map('map').setView([51.505, -0.09], 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      
      // Add initial marker
      marker = L.marker([51.5, -0.09]).addTo(map);
    }
  }, 100);
}

// Update your updateMap function:
function updateMap(lat, lon) {
  if (!map) {
    initMap();
  }
  
  setTimeout(() => {
    map.setView([lat, lon], 11);
    if (marker) {
      marker.setLatLng([lat, lon]);
    } else {
      marker = L.marker([lat, lon]).addTo(map);
    }
    
    // Force map to redraw
    map.invalidateSize();
  }, 200);
}

// Handle city search
async function handleSearch() {
  const query = searchInput.value.trim();
  if (query.length < 2) {
    searchResults.classList.add('hidden');
    return;
  }
  
  try {
    const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${OPENWEATHER_API_KEY}`);
    const data = await response.json();
    
    if (data.length > 0) {
      searchResults.innerHTML = '';
      data.forEach(location => {
        const item = document.createElement('div');
        item.className = 'search-result-item p-3 cursor-pointer';
        item.innerHTML = `
          <div class="font-medium">${location.name}, ${location.country}</div>
          <div class="text-xs opacity-80">${location.state || ''}</div>
        `;
        item.addEventListener('click', () => {
          currentLocation.lat = location.lat;
          currentLocation.lon = location.lon;
          updateWeatherData(location.lat, location.lon);
          updateMap(location.lat, location.lon);
          clearSearch();
        });
        searchResults.appendChild(item);
      });
      searchResults.classList.remove('hidden');
      closeSearchBtn.classList.remove('hidden');
    } else {
      searchResults.innerHTML = '<div class="p-3 text-center">No results found</div>';
      searchResults.classList.remove('hidden');
    }
  } catch (error) {
    console.error("Error searching locations:", error);
  }
}

// Clear search results
function clearSearch() {
  searchInput.value = '';
  searchResults.classList.add('hidden');
  searchResults.innerHTML = '';
  closeSearchBtn.classList.add('hidden');
}

// Update all weather data
async function updateWeatherData(lat, lon) {
  try {
    // Current weather
    const currentResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`);
    const currentData = await currentResponse.json();
    
    // Forecast (5 day / 3 hour)
    const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`);
    const forecastData = await forecastResponse.json();
    
    // Update UI with current weather
    updateCurrentWeather(currentData);
    
    // Update hourly forecast (24 hours)
    updateHourlyForecast(forecastData);
    
    // Update 7-day forecast
    updateDailyForecast(forecastData);
    
    // Update air quality (mock data since we'd need another API)
    updateAirQuality();
    
  } catch (error) {
    console.error("Error fetching weather data:", error);
  }
}

// Update current weather display
function updateCurrentWeather(data) {
  document.getElementById('current-location').textContent = `${data.name}, ${data.sys.country}`;
  
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', options);
  
  document.getElementById('current-temp').textContent = `${Math.round(data.main.temp)}°`;
  document.getElementById('current-desc').textContent = data.weather[0].description;
  document.getElementById('current-high').textContent = `${Math.round(data.main.temp_max)}°`;
  document.getElementById('current-low').textContent = `${Math.round(data.main.temp_min)}°`;
  document.getElementById('current-humidity').textContent = `${data.main.humidity}%`;
  document.getElementById('current-wind').textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
  
  // Update weather icon
  const weatherIcon = getWeatherIcon(data.weather[0].id, data.weather[0].icon);
  document.getElementById('current-weather-icon').innerHTML = `<i class="fas ${weatherIcon}"></i>`;
}

// Update hourly forecast
function updateHourlyForecast(data) {
  const hourlyContainer = document.getElementById('hourly-forecast');
  hourlyContainer.innerHTML = '';
  
  // Get next 24 hours (8 data points since we get data every 3 hours)
  const hourlyData = data.list.slice(0, 8);
  
  hourlyData.forEach(hour => {
    const time = new Date(hour.dt * 1000);
    const hourElement = document.createElement('div');
    hourElement.className = 'flex-shrink-0 text-center';
    
    const timeStr = time.getHours() === 0 ? '12 AM' : 
                   time.getHours() < 12 ? `${time.getHours()} AM` : 
                   time.getHours() === 12 ? '12 PM' : 
                   `${time.getHours() - 12} PM`;
    
    const weatherIcon = getWeatherIcon(hour.weather[0].id, hour.weather[0].icon);
    
    hourElement.innerHTML = `
      <p class="text-sm">${timeStr}</p>
      <div class="my-1 text-xl"><i class="fas ${weatherIcon}"></i></div>
      <p class="text-sm font-medium">${Math.round(hour.main.temp)}°</p>
    `;
    
    hourlyContainer.appendChild(hourElement);
  });
}

// Update 7-day forecast
function updateDailyForecast(data) {
  const dailyContainer = document.getElementById('daily-forecast');
  dailyContainer.innerHTML = '';
  
  // Group by day (since API returns 3-hour intervals)
  const dailyData = {};
  data.list.forEach(item => {
    const date = new Date(item.dt * 1000);
    const dateStr = date.toLocaleDateString('en-US', { weekday: 'long' });
    
    if (!dailyData[dateStr]) {
      dailyData[dateStr] = {
        temps: [],
        weather: []
      };
    }
    
    dailyData[dateStr].temps.push(item.main.temp);
    dailyData[dateStr].weather.push(item.weather[0]);
  });
  
  // Get the next 7 days
  const days = Object.keys(dailyData).slice(0, 7);
  
  days.forEach(day => {
    const dayData = dailyData[day];
    const avgTemp = Math.round(dayData.temps.reduce((a, b) => a + b, 0) / dayData.temps.length);
    const minTemp = Math.round(Math.min(...dayData.temps));
    const maxTemp = Math.round(Math.max(...dayData.temps));
    
    // Get most common weather condition for the day
    const weatherCounts = {};
    dayData.weather.forEach(w => {
      const key = w.id;
      weatherCounts[key] = (weatherCounts[key] || 0) + 1;
    });
    const mostCommonWeatherId = Object.keys(weatherCounts).reduce((a, b) => weatherCounts[a] > weatherCounts[b] ? a : b);
    const weatherIcon = getWeatherIcon(mostCommonWeatherId, dayData.weather[0].icon);
    
    const dayElement = document.createElement('div');
    dayElement.className = 'day-card flex justify-between items-center p-3 rounded-lg cursor-pointer transition';
    dayElement.innerHTML = `
      <div class="font-medium">${day}</div>
      <div class="flex items-center">
        <div class="mx-2 text-xl"><i class="fas ${weatherIcon}"></i></div>
        <div class="text-right">
          <span class="font-medium">${maxTemp}°</span> 
          <span class="opacity-70">${minTemp}°</span>
        </div>
      </div>
    `;
    
    dailyContainer.appendChild(dayElement);
  });
}

// Update air quality (mock data)
function updateAirQuality() {
  const aqi = Math.floor(Math.random() * 50) + 50; // Random between 50-100
  document.getElementById('air-quality').textContent = `${aqi} AQI`;
  
  let qualityText = '';
  let qualityColor = 'green-500';
  
  if (aqi <= 50) {
    qualityText = 'Good';
    qualityColor = 'green-500';
  } else if (aqi <= 100) {
    qualityText = 'Moderate';
    qualityColor = 'yellow-500';
  } else if (aqi <= 150) {
    qualityText = 'Unhealthy for Sensitive Groups';
    qualityColor = 'orange-500';
  } else {
    qualityText = 'Unhealthy';
    qualityColor = 'red-500';
  }
  
  document.querySelector('#air-quality + .text-xs').textContent = qualityText;
  document.querySelector('#air-quality').previousElementSibling.classList.remove('bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500');
  document.querySelector('#air-quality').previousElementSibling.classList.add(`bg-${qualityColor}`);
  
  // Update UV index (mock data)
  const uvIndex = Math.floor(Math.random() * 5) + 3; // Random between 3-7
  document.getElementById('uv-index').textContent = uvIndex;
  
  let uvText = '';
  let uvColor = 'yellow-500';
  
  if (uvIndex <= 2) {
    uvText = 'Low';
    uvColor = 'green-500';
  } else if (uvIndex <= 5) {
    uvText = 'Moderate';
    uvColor = 'yellow-500';
  } else if (uvIndex <= 7) {
    uvText = 'High';
    uvColor = 'orange-500';
  } else {
    uvText = 'Very High';
    uvColor = 'red-500';
  }
  
  document.querySelector('#uv-index + .text-xs').textContent = uvText;
  document.querySelector('#uv-index').previousElementSibling.classList.remove('bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500');
  document.querySelector('#uv-index').previousElementSibling.classList.add(`bg-${uvColor}`);
}

// Get appropriate weather icon
function getWeatherIcon(weatherId, iconCode) {
  // Weather codes from OpenWeatherMap
  if (weatherId >= 200 && weatherId < 300) {
    return 'fa-bolt'; // Thunderstorm
  } else if (weatherId >= 300 && weatherId < 400) {
    return 'fa-cloud-rain'; // Drizzle
  } else if (weatherId >= 500 && weatherId < 600) {
    return iconCode.includes('d') ? 'fa-cloud-sun-rain' : 'fa-cloud-moon-rain'; // Rain
  } else if (weatherId >= 600 && weatherId < 700) {
    return 'fa-snowflake'; // Snow
  } else if (weatherId >= 700 && weatherId < 800) {
    return 'fa-smog'; // Atmosphere (fog, haze, etc.)
  } else if (weatherId === 800) {
    return iconCode.includes('d') ? 'fa-sun' : 'fa-moon'; // Clear
  } else if (weatherId > 800) {
    return iconCode.includes('d') ? 'fa-cloud-sun' : 'fa-cloud-moon'; // Clouds
  }
  return 'fa-cloud';
}

// Debounce function for search
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}