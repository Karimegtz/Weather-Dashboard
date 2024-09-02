const historyLog = [];
const apiBaseUrl = 'https://api.openweathermap.org';
const apiKey = '71335ba6c0db583974b1d16c33cd8470';

const formElement = document.querySelector('#city-search-form');
const inputElement = document.querySelector('#city-search-input');

const currentWeatherContainer = document.querySelector('#current-weather');
const forecastSection = document.querySelector('#future-weather');
const historyContainer = document.querySelector('#search-history');

dayjs.extend(window.dayjs_plugin_utc);
dayjs.extend(window.dayjs_plugin_timezone);

function displaySearchHistory() {
  historyContainer.innerHTML = '';

  for (let i = historyLog.length - 1; i >= 0; i--) {
    const historyButton = document.createElement('button');
    historyButton.setAttribute('type', 'button');
    historyButton.setAttribute('aria-controls', 'current-weather future-weather');
    historyButton.classList.add('history-btn', 'btn-history');
    historyButton.setAttribute('data-search', historyLog[i]);
    historyButton.textContent = historyLog[i];
    historyContainer.append(historyButton);
  }
}

function addToHistory(search) {
  if (historyLog.includes(search)) {
    return;
  }
  historyLog.push(search);

  localStorage.setItem('weather-history', JSON.stringify(historyLog));
  displaySearchHistory();
}

function loadSearchHistory() {
  const storedHistory = localStorage.getItem('weather-history');
  if (storedHistory) {
    historyLog.push(...JSON.parse(storedHistory));
  }
  displaySearchHistory();
}

function showCurrentWeather(city, weatherData) {
  const currentDate = dayjs().format('M/D/YYYY');

  const temperature = weatherData.main.temp;
  const windSpeed = weatherData.wind.speed;
  const humidityLevel = weatherData.main.humidity;
  const weatherIconUrl = `https://openweathermap.org/img/w/${weatherData.weather[0].icon}.png`;
  const iconAltText = weatherData.weather[0].description || weatherData.weather[0].main;

  const weatherCard = document.createElement('div');
  const cardDetails = document.createElement('div');
  const cardTitle = document.createElement('h2');

  const weatherIcon = document.createElement('img');
  const tempText = document.createElement('p');
  const windText = document.createElement('p');
  const humidityText = document.createElement('p');

  weatherCard.classList.add('card');
  cardDetails.classList.add('card-body');
  weatherCard.append(cardDetails);

  cardTitle.classList.add('h3', 'card-title');
  tempText.classList.add('card-text');
  windText.classList.add('card-text');
  humidityText.classList.add('card-text');

  cardTitle.textContent = `${city} (${currentDate})`;
  weatherIcon.setAttribute('src', weatherIconUrl);
  weatherIcon.setAttribute('alt', iconAltText);
  weatherIcon.classList.add('weather-img');
  cardTitle.append(weatherIcon);

  tempText.textContent = `Temp: ${temperature}°F`;
  windText.textContent = `Wind: ${windSpeed} MPH`;
  humidityText.textContent = `Humidity: ${humidityLevel} %`;

  cardDetails.append(cardTitle, tempText, windText, humidityText);

  currentWeatherContainer.innerHTML = '';
  currentWeatherContainer.append(weatherCard);
}

function createForecastCard(forecastData) {
  const weatherIconUrl = `https://openweathermap.org/img/w/${forecastData.weather[0].icon}.png`;
  const iconAltText = forecastData.weather[0].description;
  const temperature = forecastData.main.temp;
  const humidityLevel = forecastData.main.humidity;
  const windSpeed = forecastData.wind.speed;

  const column = document.createElement('div');
  const weatherCard = document.createElement('div');
  const cardDetails = document.createElement('div');
  const cardTitle = document.createElement('h5');
  const weatherIcon = document.createElement('img');
  const tempText = document.createElement('p');
  const windText = document.createElement('p');
  const humidityText = document.createElement('p');

  column.append(weatherCard);
  weatherCard.append(cardDetails);
  cardDetails.append(cardTitle, weatherIcon, tempText, windText, humidityText);

  column.classList.add('col-md', 'five-day-card');
  weatherCard.classList.add('card', 'bg-primary', 'h-100', 'text-white');
  cardDetails.classList.add('card-body', 'p-2');

  cardTitle.classList.add('card-title');
  tempText.classList.add('card-text');
  windText.classList.add('card-text');
  humidityText.classList.add('card-text');

  cardTitle.textContent = dayjs(forecastData.dt_txt).format('M/D/YYYY');
  weatherIcon.setAttribute('src', weatherIconUrl);
  weatherIcon.setAttribute('alt', iconAltText);
  tempText.textContent = `Temp: ${temperature} °F`;
  windText.textContent = `Wind: ${windSpeed} MPH`;
  humidityText.textContent = `Humidity: ${humidityLevel} %`;

  forecastSection.append(column);
}

function displayForecast(forecastData) {
  const startDate = dayjs().add(1, 'day').startOf('day').unix();
  const endDate = dayjs().add(6, 'day').startOf('day').unix();

  const headerColumn = document.createElement('div');
  const header = document.createElement('h4');

  headerColumn.classList.add('col-12');
  header.textContent = '4-Day Forecast:';
  headerColumn.append(header);

  forecastSection.innerHTML = '';
  forecastSection.append(headerColumn);

  for (let i = 0; i < forecastData.length; i++) {
    if (forecastData[i].dt >= startDate && forecastData[i].dt < endDate) {
      if (forecastData[i].dt_txt.slice(11, 13) == '12') {
        createForecastCard(forecastData[i]);
      }
    }
  }
}

function updateWeatherDisplay(city, weatherData) {
  showCurrentWeather(city, weatherData.list[0]);
  displayForecast(weatherData.list);
}

function getWeatherData(location) {
  const { lat, lon, name } = location;
  const apiUrl = `${apiBaseUrl}/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`;

  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      updateWeatherDisplay(name, data);
    })
    .catch(error => {
      console.error('Error fetching weather data:', error);
    });
}

function getCoordinates(cityName) {
  const apiUrl = `${apiBaseUrl}/geo/1.0/direct?q=${cityName}&limit=5&appid=${apiKey}`;

  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      if (!data[0]) {
        alert('Location not found');
      } else {
        addToHistory(cityName);
        getWeatherData(data[0]);
      }
    })
    .catch(error => {
      console.error('Error fetching coordinates:', error);
    });
}

function handleFormSubmit(event) {
  event.preventDefault();

  const searchQuery = inputElement.value.trim();
  if (searchQuery) {
    getCoordinates(searchQuery);
    inputElement.value = '';
  }
}

function handleHistoryClick(event) {
  if (event.target.matches('.btn-history')) {
    const cityName = event.target.getAttribute('data-search');
    getCoordinates(cityName);
  }
}

loadSearchHistory();
formElement.addEventListener('submit', handleFormSubmit);
historyContainer.addEventListener('click', handleHistoryClick);
