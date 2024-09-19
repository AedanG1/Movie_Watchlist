document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.querySelector('#search-input');
    const resultsContainer = document.querySelector('#search-results');
    const searchBtn = document.querySelector('#search-btn');
    const watchlistContainer = document.querySelector('#watchlist-container');
    const emptyWatchlistMessage = document.querySelector('#empty-watchlist');
    const regionSelectWatchlist = document.querySelector('#region-select-watchlist');
    const regionSelectSearch = document.querySelector('#region-select-search');

    //Open Movie Database API
    const omdbUrl = 'http://www.omdbapi.com/';
    const omdbKey = 'e89f91c6';

    //The Movie Database API
    const tmdbUrl = 'https://api.themoviedb.org/3/movie/';
    const tmdbImgUrl = 'https://image.tmdb.org/t/p/original/';
    const tmdbOptions = {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0NzlhM2ZjZGIzY2ExYWZiYmFiMTZmZGVkOGJiM2Q2MiIsIm5iZiI6MTcyNjE5NjgzMy4xNDg0OTYsInN1YiI6IjY2ZTNhOGRjMDAwMDAwMDAwMGI5NzdmNiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.buaRuQaaNo8uBgvNhdDr1dp3R25FwU2xySzULFXwb_A'
        }
      };

    //Localstorage Watchlist Array
    while (!localStorage.wannaWatchList) {
        const newWatchlist = [];
        localStorage.wannaWatchList = JSON.stringify(newWatchlist);
    }

    //Get region value from Localstorage
    if (!localStorage.region) {
        localStorage.setItem("region", JSON.stringify(regionSelectWatchlist.value));
    }

    //Handle search button
    document.body.addEventListener('click', e => {
        if (e.target.classList.contains('addButton') || e.target.classList.contains('removeButton')) {
            const watchlist = JSON.parse(localStorage.wannaWatchList);
            const item = e.target.closest('.item-container');
            const button = item.querySelector('button');
            if (e.target.classList.contains('addButton')) {
                const itemId = e.target.closest('.item-container').dataset.omdbid; 
                const hasDuplicate = watchlist.includes(itemId);
                if (!hasDuplicate) {
                    watchlist.push(itemId);
                    localStorage.wannaWatchList = JSON.stringify(watchlist);
                }
                button.classList.replace('addButton', 'removeButton');
                button.innerText = '❌ remove'
                console.log(localStorage.wannaWatchList);
            } else {
                const itemId = e.target.closest('.item-container').dataset.omdbid;
                const hasItem = watchlist.includes(itemId);
                if (hasItem) {
                    const updatedWatchlist = watchlist.filter(id => id !== itemId);
                    localStorage.wannaWatchList = JSON.stringify(updatedWatchlist);
                }
                item.remove();
                console.log(localStorage.wannaWatchList);
            }
        }
    })
      
    async function getMovieSearch(query) {
        resultsContainer.innerHTML = '';
        try {
            const response = await fetch(`${omdbUrl}?s=${query}&type=movie&apikey=${omdbKey}`);
            if (!response.ok) {
                throw new Error(response.status);
            }
            const movies = await response.json();
            if (movies.Response === "False") {
                throw new Error(movies.Error);
            }
            return movies.Search;
        } catch(error) {
            console.error(error);
            const emptyState = document.createElement('div');
            const message = document.createElement('h2');
            emptyState.classList.add('empty-state');
            message.innerText = "Sorry, unable to find what you're looking for";
            resultsContainer.append(emptyState);
            emptyState.append(message);
        }
    }

    async function getMovieDetails(idArray) {
        const promisesArray = idArray.map(async id => {
            try {
                const response = await fetch(`${omdbUrl}?i=${id}&apikey=${omdbKey}`);
                if (!response.ok) {
                    throw new Error(response.status);
                }
                return response.json();
            } catch(error) {
                console.error(error);
            }
        });
        return await Promise.all(promisesArray);
    }

    async function appendTmdbIds(omdbMovieDetails) {
        const promisesArray = omdbMovieDetails.map(async detail => {
            try {
                const response = await fetch(`${tmdbUrl}${detail.imdbID}/external_ids`, tmdbOptions);
                if (!response.ok) {
                    throw new Error(response.status);
                }
                const tmdbId = await response.json();
                return {...detail, "tmdbID": `${tmdbId.id}`};
            } catch(error) {
                console.error("Error fetching The Movie Database ID:", error);
                return {...detail, "tmdbID": null};
            }
        })
        return await Promise.all(promisesArray);
    }

    async function appendWhereToWatch(unfinishedMovieDetails, region) {
        const promisesArray = unfinishedMovieDetails.map(async detail => {
            try {
                if (detail.tmdbID) {
                    const response = await fetch(`${tmdbUrl}${detail.tmdbID}/watch/providers`, tmdbOptions);
                    if (!response.ok) {
                        throw new Error(response.status);
                    }
                    const allProviders = await response.json();
                    const regionProviders = allProviders.results[region];
                    return {...detail, "watch_providers": regionProviders}
                } else {
                    return {...detail, "watch_providers": null};
                }
            } catch(error) {
                console.error("Error fetching Watch Provider", error);
            }
        })
        return await Promise.all(promisesArray);
    }

    async function getCompleteDetails(parameter, region) {
        let idArray = [];
        if (typeof(parameter) === "string") {
            const omdbMoviesArray = await getMovieSearch(parameter);
            if (omdbMoviesArray) {
                idArray = omdbMoviesArray.map(movie => movie.imdbID);
            }
        } else if (Array.isArray(parameter)) {
            idArray = parameter;
        }
        const omdbMovieDetails = await getMovieDetails(idArray);
        const incompleteMovieDetails = await appendTmdbIds(omdbMovieDetails);
        const completeMovieDetails = await appendWhereToWatch(incompleteMovieDetails, region);
        return completeMovieDetails;
    }

    function displayMovieItems(movieDetails, container) {
        container.innerHTML = '';
        movieDetails.forEach(details => {
            let buttonState = '';
            let buttonText = '';
            const watchlist = JSON.parse(localStorage.wannaWatchList);
            if (watchlist.includes(`${details.imdbID}`)) {
                buttonState = 'removeButton';
                buttonText = '❌ remove'
            } else {
                buttonState = 'addButton';
                buttonText = '✅ add to list'
            }
            if (details.imdbRating !== 'N/A' && details.Rated !== 'N/A') {
                container.innerHTML += `
                    <div class="item-container" data-omdbId="${details.imdbID}">
                        <img class="poster" src="${details.Poster}">
                        <div class="item-info" id="${details.tmdbID}">
                            <div class="title-container">
                                <div class="title-info">
                                    <p class="title">${details.Title}</p>
                                    <p class="subtle" style="font-size:0.9rem;">(${details.Rated})</p>
                                </div>
                                <button class="${buttonState}">${buttonText}</button>
                            </div>
                            <div class="subtitle">
                                <p class="rating">⭐️ ${details.imdbRating}</p>
                                <p class="subtle">${details.Runtime}</p>
                                <p class="subtle genre">${details.Genre}</p>
                                <p class="subtle">${details.Year}</p>
                            </div>
                            <p class="description">${details.Plot}</p>
                        </div>
                    </div> 
                `;
                if (details.watch_providers && details.watch_providers.flatrate) {
                    const watchProviderEl = document.createElement('div');
                    watchProviderEl.classList.add('watch-providers');
                    for (const provider of details.watch_providers.flatrate) {
                        const providerIcon = document.createElement('img');
                        providerIcon.src = `${tmdbImgUrl}${provider.logo_path}`;
                        watchProviderEl.append(providerIcon);
                    }
                    document.getElementById(`${details.tmdbID}`).append(watchProviderEl);
                }
            }
        })
    }

    //Populate Search page
    if (searchBtn) {
        regionSelectSearch.value = JSON.parse(localStorage.region);

        searchBtn.addEventListener('click', e => {
            e.preventDefault();

            toggleLoadingSkeleton(resultsContainer, true);

            async function displaySearchItems(region) {
                const inputValue = searchInput.value;
                const movieDetails = await getCompleteDetails(inputValue, region);
                if (movieDetails.length !== 0) {
                    displayMovieItems(movieDetails, resultsContainer);
                }
            }
            displaySearchItems(regionSelectSearch.value);

            regionSelectSearch.addEventListener('change', () => {
                displaySearchItems(regionSelectSearch.value);
                localStorage.setItem("region", JSON.stringify(regionSelectSearch.value));
            })
        })
    }

    // Populate Watchlist page
    if (watchlistContainer) {
        regionSelectWatchlist.value = JSON.parse(localStorage.region);


        if (JSON.parse(localStorage.wannaWatchList).length < 1) {
            emptyWatchlistMessage.classList.remove('hidden');
        } else {
            emptyWatchlistMessage.classList.add('hidden');
            toggleLoadingSkeleton(watchlistContainer, true);
        }
        
        async function displayWatchlist(region) {
            const movieDetails = await getCompleteDetails(JSON.parse(localStorage.wannaWatchList), region);
            if (movieDetails.length !== 0) {
                displayMovieItems(movieDetails, watchlistContainer);
            }
        }
        displayWatchlist(regionSelectWatchlist.value);

        regionSelectWatchlist.addEventListener('change', () => {
            displayWatchlist(regionSelectWatchlist.value);
            localStorage.setItem("region", JSON.stringify(regionSelectWatchlist.value));
        })
    }    

    //Loading State
    function toggleLoadingSkeleton(container, isLoading) {
        if (isLoading) {
            container.innerHTML = `
                <div class="skeleton-item">
                    <div class="skeleton skeleton-poster"></div>
                    <div class="skeleton-info">
                        <div class="skeleton skeleton-title"></div>
                        <div class="skeleton-desc">
                            <div class="skeleton skeleton-text"></div>
                            <div class="skeleton skeleton-text"></div>
                            <div class="skeleton skeleton-text"></div>
                            <div class="skeleton skeleton-text"></div>
                            <div class="skeleton-icons">
                                <div class="skeleton skeleton-icon"></div>
                                <div class="skeleton skeleton-icon"></div>
                                <div class="skeleton skeleton-icon"></div>
                                <div class="skeleton skeleton-icon"></div>
                            </div>
                        </div>
                    </div>
                </div> 
            `
        }
    }

})