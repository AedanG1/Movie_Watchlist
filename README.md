# Movie_Watchlist
#### Video Demo: <Url HERE>
#### Description:
This project is a web based movie watchlist app. Users are able to choose the region they're in, search for a movie, and add it to their watchlist. Each movie item displays information about the movie as well as the streaming services the movie is available on according to the region they've selected.

#### Files:
- index.html
This file includes the HTML for the index page of the webapp where the user can view their watchlist.

- search.html
This file includes the HTML for the search page of the webapp where the user can search for movies using a string.

- styles.css
This file includes all the css styles and animation for the loading state.

- main.js
This file includes all the JavaScript functions to make the webapp interactive. The majority of my time on this project was spent in this file. At the beginning of the project my idea was to make a watchlist that displayed the basic information for each movie using an API. However after some thinking I realized that one of the main issues I usually have when pulling up a movie to watch is finding which streaming platform it's available on. This led me to searching for free API's that included the data regarding which streaming platforms the movies were available on. Luckily, The Movie Database had just that. Unfortunately, the search endpoint TMDB provides didn't provide all the necessary details about the movie that I needed, such as runtime and genres. Because of this, I decided to 'stitch' together API calls from TMDB(streaming availability) and the Online Movie Database(movie details) to get the data I needed. This introduced some more complexity. Beforehand, I assumed that I could make a call to the OMDB for the necessary details, then use the IMDB id that was included in the OMDB call to get the corresponding streaming platforms by calling the TMDB API. This didn't work because the TMDB "where_to_watch" endpoint only takes it's own movie database ids as arguments. Luckily TMDB has an endpoint that provides it's movie ids by taking an IMDB id as an argument. So now the path to getting the data I needed was clear. I wrote a function to get the details from the OMDB API, then passed the IMDB id(from the OMDB API call) to the TMDB API call which provides a corresponding TMDB id. I then used this TMDB id to make a final API call to the TMDB endpoint that provides the corresponding streaming platforms.

I allowed the user to save movies to their watchlist by using local storage to store the IMDB ids of the movies in an array. Upon loading into the website, local storage is checked to see if a watchlist array exists. If there isn't one, a new one is created, and if there is, the array is passed to the getCompleteDetails function to be used to call the OMDB API for the movie's details.

The API call can sometimes take time to load so I included a skeleton state which signals to the user that the content is loading. I used CSS to add an animation to the skeleton element as a visual cue that something is happening in the background.

#### Further considerations
If I were to work on this project for longer, I would want to implement more filters for searching and allow users to set which streaming services they are already subscribed to so that only movies that are available on those platforms are shown. Adding the ability to search for shows and series would be a goal as well. Regarding the actual programming of the webapp, I would like to refactor the code and create an object for the Movie items. This would allow me to manage state better and make the code more readable and scalable.
