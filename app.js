const geocodeUrl = "https://geocoding-api.open-meteo.com/v1/search?name=";
const weatherUrl = "https://api.open-meteo.com/v1/forecast";

const searchBox = document.querySelector(".search input");
const searchBtn = document.querySelector(".search button");
const weatherIcon = document.querySelector(".weather-icon");
const suggestionsBox = document.getElementById("suggestions");

let debounceTimer;

async function fetchSuggestions(query) {
  if (query.length < 2) {
    suggestionsBox.innerHTML = "";
    suggestionsBox.style.display = "none";
    return;
  }

  const response = await fetch(`${geocodeUrl}${encodeURIComponent(query)}&count=5&language=en`);
  if (!response.ok) {
    suggestionsBox.innerHTML = "";
    suggestionsBox.style.display = "none";
    return;
  }

  const data = await response.json();
  if (!data.results || data.results.length === 0) {
    suggestionsBox.innerHTML = "";
    suggestionsBox.style.display = "none";
    return;
  }

  suggestionsBox.innerHTML = "";
  suggestionsBox.style.display = "block";

  data.results.forEach((city) => {
    const item = document.createElement("div");
    item.classList.add("suggestion-item");
    item.innerHTML = `<span class="suggestion-city">${city.name}</span><span class="suggestion-country">${city.country || ""}</span>`;
    item.addEventListener("click", () => {
      const selectedCity = city.name.trim();
      searchBox.value = selectedCity;
      suggestionsBox.innerHTML = "";
      suggestionsBox.style.display = "none";
      checkWeather(selectedCity);
    });
    suggestionsBox.appendChild(item);
  });
}

function hideSuggestions() {
  suggestionsBox.innerHTML = "";
  suggestionsBox.style.display = "none";
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".search")) {
    hideSuggestions();
  }
});

searchBox.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    fetchSuggestions(searchBox.value.trim());
  }, 300);
});

async function checkWeather(city) {
  const normalizedCity = city.trim();
  if (!normalizedCity) {
    return;
  }

  const geoResponse = await fetch(`${geocodeUrl}${encodeURIComponent(normalizedCity)}&count=1`);
  if (!geoResponse.ok) {
    alert("Could not fetch city data. Please try again.");
    return;
  }

  const geoData = await geoResponse.json();
  if (!geoData.results || geoData.results.length === 0) {
    alert("City not found! Please try again.");
    return;
  }

  const { latitude, longitude, name } = geoData.results[0];
  const weatherResponse = await fetch(
    `${weatherUrl}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&temperature_unit=celsius&wind_speed_unit=kmh`,
  );

  if (!weatherResponse.ok) {
    alert("Could not fetch weather data. Please try again.");
    return;
  }

  const weatherData = await weatherResponse.json();
  const current = weatherData.current;

  document.querySelector(".city").innerHTML = name;
  document.querySelector(".temp").innerHTML = `${Math.round(current.temperature_2m)}°C`;
  document.querySelector(".humidity").innerHTML = `${current.relative_humidity_2m}%`;
  document.querySelector(".wind").innerHTML = `${Math.round(current.wind_speed_10m)} km/h`;

  const code = current.weather_code;
  if (code === 0 || code === 1) {
    weatherIcon.src = "images/clear.png";
  } else if (code === 2 || code === 3) {
    weatherIcon.src = "images/clouds.png";
  } else if (code >= 51 && code <= 67) {
    weatherIcon.src = "images/drizzle.png";
  } else if (code >= 71 && code <= 77) {
    weatherIcon.src = "images/snow.png";
  } else if (code >= 80 && code <= 82) {
    weatherIcon.src = "images/rain.png";
  } else if (code >= 95) {
    weatherIcon.src = "images/rain.png";
  } else {
    weatherIcon.src = "images/clouds.png";
  }
}

searchBtn.addEventListener("click", () => {
  hideSuggestions();
  checkWeather(searchBox.value);
});

searchBox.addEventListener("keyup", (event) => {
  if (event.key === "Enter") {
    hideSuggestions();
    checkWeather(searchBox.value);
  }
});

checkWeather("Cairo");
