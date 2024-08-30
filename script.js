const searchHistory = [];
const weatherApiRootUrl = 'https://api.openweathermap.org';
const weatherApiKey = '71335ba6c0db583974b1d16c33cd8470';



const searchForm = document.querySelector('#search-form');
const searchInput = document.querySelector('#search-input');

const todayContainer = document.querySelector('#today');

const forecastContainer = document.querySelector('#forecast');
const searchHistoryContainer = document.querySelector('#history');


dayjs.extend(window.dayjs_plugin_utc);
dayjs.extend(window.dayjs_plugin_timezone);



function renderSearchHistory() {
  searchHistoryContainer.innerHTML = '';



  for (let i = searchHistory.length - 1; i >= 0; i--) {
    const btn = document.createElement('button');
    btn.setAttribute('type', 'button');
    btn.setAttribute('aria-controls', 'today forecast');
    btn.classList.add('history-btn', 'btn-history');




    btn.setAttribute('data-search', searchHistory[i]);
    btn.textContent = searchHistory[i];
    searchHistoryContainer.append(btn);
  }
}



function appendToHistory(search) {
  
  if (searchHistory.indexOf(search) !== -1) {
    return;
  }
  searchHistory.push(search);

  localStorage.setItem('search-history', JSON.stringify(searchHistory));
  renderSearchHistory();
}



function initSearchHistory() {
  const storedHistory = localStorage.getItem('search-history');
  if (storedHistory) {
    searchHistory = JSON.parse(storedHistory);
  }
  renderSearchHistory();
}



function renderCurrentWeather(city, weather) {
  const date = dayjs().format('M/D/YYYY');
 


  const tempF = weather.main.temp;
  const windMph = weather.wind.speed;
  const humidity = weather.main.humidity;
  const iconUrl = `https://openweathermap.org/img/w/${weather.weather[0].icon}.png`;
  const iconDescription = weather.weather[0].description || weather[0].main;

  const card = document.createElement('div');
  const cardBody = document.createElement('div');
  const heading = document.createElement('h2');

  const weatherIcon = document.createElement('img');
  const tempEl = document.createElement('p');
  const windEl = document.createElement('p');

  const humidityEl = document.createElement('p');

  card.setAttribute('class', 'card');
  cardBody.setAttribute('class', 'card-body');
  card.append(cardBody);

  heading.setAttribute('class', 'h3 card-title');
  tempEl.setAttribute('class', 'card-text');
  windEl.setAttribute('class', 'card-text');
  humidityEl.setAttribute('class', 'card-text');

  heading.textContent = `${city} (${date})`;
  weatherIcon.setAttribute('src', iconUrl);
  weatherIcon.setAttribute('alt', iconDescription);
  weatherIcon.setAttribute('class', 'weather-img');
  heading.append(weatherIcon);


  tempEl.textContent = `Temp: ${tempF}°F`;

  windEl.textContent = `Wind: ${windMph} MPH`;
  humidityEl.textContent = `Humidity: ${humidity} %`;


  cardBody.append(heading, tempEl, windEl, humidityEl);

  todayContainer.innerHTML = '';
  todayContainer.append(card);
}


function renderForecastCard(forecast) {


  const iconUrl = `https://openweathermap.org/img/w/${forecast.weather[0].icon}.png`;
  const iconDescription = forecast.weather[0].description;
  const tempF = forecast.main.temp;
  const humidity = forecast.main.humidity;
  const windMph = forecast.wind.speed;



  const col = document.createElement('div');
  const card = document.createElement('div');

  const cardBody = document.createElement('div');
  const cardTitle = document.createElement('h5');
  const weatherIcon = document.createElement('img');
  const tempEl = document.createElement('p');

  const windEl = document.createElement('p');
  const humidityEl = document.createElement('p');

  col.append(card);
  card.append(cardBody);
  cardBody.append(cardTitle, weatherIcon, tempEl, windEl, humidityEl);

  col.setAttribute('class', 'col-md');
  col.classList.add('five-day-card');
  card.setAttribute('class', 'card bg-primary h-100 text-white');
  cardBody.setAttribute('class', 'card-body p-2');

  cardTitle.setAttribute('class', 'card-title');
  tempEl.setAttribute('class', 'card-text');

  windEl.setAttribute('class', 'card-text');
  humidityEl.setAttribute('class', 'card-text');



  cardTitle.textContent = dayjs(forecast.dt_txt).format('M/D/YYYY');
  weatherIcon.setAttribute('src', iconUrl);
  weatherIcon.setAttribute('alt', iconDescription);
  tempEl.textContent = `Temp: ${tempF} °F`;

  windEl.textContent = `Wind: ${windMph} MPH`;
  humidityEl.textContent = `Humidity: ${humidity} %`;

  forecastContainer.append(col);
}



function renderForecast(dailyForecast) {
  const startDt = dayjs().add(1, 'day').startOf('day').unix();
  const endDt = dayjs().add(6, 'day').startOf('day').unix();

  const headingCol = document.createElement('div');
  const heading = document.createElement('h4');

  headingCol.setAttribute('class', 'col-12');
  heading.textContent = '5-Day Forecast:';
  headingCol.append(heading);

  forecastContainer.innerHTML = '';
  forecastContainer.append(headingCol);

  for (let i = 0; i < dailyForecast.length; i++) {
    
    if (dailyForecast[i].dt >= startDt && dailyForecast[i].dt < endDt) {
      

      if (dailyForecast[i].dt_txt.slice(11, 13) == '12') {
        renderForecastCard(dailyForecast[i]);
      }
    }
  }
}

function renderItems(city, data) {
  renderCurrentWeather(city, data.list[0], data.city.timezone);
  renderForecast(data.list);
}




function fetchWeather(location) {
  const { lat } = location;
  const { lon } = location;
  const city = location.name;


  const apiUrl = `${weatherApiRootUrl}/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${weatherApiKey}`;

  fetch(apiUrl)
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      renderItems(city, data);
    })
    .catch(function (err) {
      console.error(err);
    });
}

function fetchCoords(search) {
  const apiUrl = `${weatherApiRootUrl}/geo/1.0/direct?q=${search}&limit=5&appid=${weatherApiKey}`;

  fetch(apiUrl)
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      if (!data[0]) {
        alert('Location not found');
      } else {
        appendToHistory(search);
        fetchWeather(data[0]);
      }
    })
    .catch(function (err) {
      console.error(err);
    });
}

function handleSearchFormSubmit(e) {
  

  if (!searchInput.value) {
    return;
  }

  e.preventDefault();
  const search = searchInput.value.trim();
  fetchCoords(search);
  searchInput.value = '';
}

function handleSearchHistoryClick(e) {


  if (!e.target.matches('.btn-history')) {
    return;
  }

  const btn = e.target;
  const search = btn.getAttribute('data-search');
  fetchCoords(search);
}

initSearchHistory();
searchForm.addEventListener('submit', handleSearchFormSubmit);
searchHistoryContainer.addEventListener('click', handleSearchHistoryClick);
