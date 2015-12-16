ArtisTree README by SuperWomen

We used JQuery, store.js, Bootstrap, d3, and Handlebars as external libraries for our application, and adapted https://github.com/fsahin/artist-explorer/blob/master/js/dndTree.js to implement our library d3Tree.js for ArtisTree’s tree viualization functionality. ArtistTree was implemented with Sublime Text 3 and tested with the latest versions of Google Chrome, Safari, and Firefox on MacBooks.

Issues:
- Initial loading of the home page and tree expansion are slow because they require multiple API calls. The tree should expand after a second. The homepage will load faster after the initial load.
- Help popups do not work on Firefox but work on Chrome and Safari.

Requirements:
- The user must have the Desktop Spotify application.
- The user must have a Spotify account.

To run the application, open index.html in a browser (Chrome or Safari).
