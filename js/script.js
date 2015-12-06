$(document).ready(function() {
	var ECHO_NEST_API_KEY = 'PF5AWHKSEDOEJ6IXM';
	var treeViewHTML = 
		'<div id="tree-view"></div>' +
		'<div id="save">' +
      		'<button type="button" class="btn btn-primary btn-sm">' +
	    		'Save this tree' +
      		'</button>' +
    	'</div>';

    var spotifyPlayTemplateSource = $('#spotify-play-template').html();
    var spotifyPlayTemplate = Handlebars.compile(spotifyPlayTemplateSource);

	var getMostPopularArtists = function() {
		$.ajax({
			url: 'http://developer.echonest.com/api/v4/artist/top_hottt',
			data: {
				api_key: ECHO_NEST_API_KEY,
				results: 8,
				bucket: 'id:spotify',
				limit: true
			},
			success: function(data) {
				var topArtists = data.response.artists;
				for(var i=0, l=topArtists.length; i<l; i++) {
					getArtistImageAndName(i, topArtists[i].foreign_ids[0].foreign_id.slice(15));
				}
			}
		});
	}

	var suggestArtists = function (query) {
		$.ajax({
			url: 'http://developer.echonest.com/api/v4/artist/suggest',
			data: {
				api_key: ECHO_NEST_API_KEY,
				results: 15,
				q: query
			},
			success: function(response) {
				console.log(response);
			}
		});
	}

	var getArtistImageAndName = function (index, artistId) {
		$.ajax({
			url: 'https://api.spotify.com/v1/artists/'+artistId,
			success: function(response) {
				var name = response.name;
				$('#'+index).find('img').attr('src', response.images[2].url);
				$('#'+index).find('img').attr('alt', name);	
				$('#'+index).find('h3').text(name);
			}
		});
	}

	var searchForArtist = function (artistName) {
		$.ajax({
			url : 'https://api.spotify.com/v1/search',
			data: {
				q: artistName,
				type: 'artist'
			},
			success: function(response) {
				var artist = response.artists.items[0];
				getTopTracksForArtist(artist.name, artist.id, artist.images[2].url);
			}
		});
	}

	var getTopTracksForArtist = function (artistName, artistId, artistImage) {
		$.ajax({
			url : 'https://api.spotify.com/v1/artists/'+artistId+'/top-tracks',
			data: {
				country: 'US'
			},
			success: function(response) {
				$('#rightpane').html(spotifyPlayTemplate({name: artistName, url: artistImage, tracks: response.tracks}));
			}
		});
	}

	var getSimilarArtists = function (artistId) {
		$.ajax({
			url: 'http://developer.echonest.com/api/v4/artist/similar',
			data: {
				api_key: ECHO_NEST_API_KEY,
				id: 'spotify:artist:'+artistId,
				results: 5,
				bucket: 'id:spotify',
				limit: true
			},
			success: function(data) {
				console.log(data);
			}
		});
	}

	var init = function() {
		$('#rightpane').height($(window).height());
		$('#rightpane').hide();
		getMostPopularArtists();
	}

	init();

	$('.thumbnail').find('a').click(function() {
		$('#main').html(treeViewHTML);
		$('#rightpane').show();
	});

	$('#search-artist').submit(function(event) {
		event.preventDefault();
		suggestArtists($('#search-field').val());
		searchForArtist($('#search-field').val());
	});

	$('.brand').click(function(){
		window.location.reload();
	});
});

