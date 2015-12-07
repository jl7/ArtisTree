$(document).ready(function() {
	var ECHO_NEST_API_KEY = 'PF5AWHKSEDOEJ6IXM';
	var CHILD_LIMIT = 5;

    var spotifyPlayTemplateSource = $('#spotify-play-template').html();
    var spotifyPlayTemplate = Handlebars.compile(spotifyPlayTemplateSource);
    var suggestResultsTemplateSource = $('#suggest-results-template').html();
	var suggestResultsTemplate = Handlebars.compile(suggestResultsTemplateSource); 
	//get name when item is clicked on dropdown menu 
	Handlebars.registerHelper('json', function(context) {
	    return JSON.stringify(context);
	});

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
					getArtistData(i, topArtists[i].foreign_ids[0].foreign_id.slice(15));
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
				q: query,
			},
			success: function(data) {
				console.log(data.response);
   				$('.suggest-nav').html(suggestResultsTemplate(data.response));
   				$('.suggest-nav').show();
   			}
	    });
	}

	var getSimilarArtistsForNode = function (node, exploredArtistIds) {
		$.ajax({
			url: 'http://developer.echonest.com/api/v4/artist/similar',
			data: {
				api_key: ECHO_NEST_API_KEY,
				id: 'spotify:artist:'+node.artist.id,
				results: CHILD_LIMIT,
				bucket: ['hotttnesss_rank','id:spotify'],
				limit: true
			},
			traditional: true,
			success: function(data) {
				data.response.artists.sort(function (a, b) {
                    return a.hotttnesss_rank-b.hotttnesss_rank;
                });
                data.response.artists = data.response.artists.filter(function (artist) {
                    return exploredArtistIds.indexOf(artist.foreign_ids[0].foreign_id.slice(15)) === -1;
                });
                var similarArtists = data.response.artists.slice(0, 5);
                for(var i=0, l=similarArtists.length; i<l; i++) {
					getArtistAndSetChild(i, node, similarArtists[i].foreign_ids[0].foreign_id.slice(15));
				}
			}
		});
	}

	var getArtistData = function (index, artistId) {
		$.ajax({
			url: 'https://api.spotify.com/v1/artists/'+artistId,
			success: function(response) {
				var name = response.name;
				$('#'+index).find('img').attr('src', response.images[2].url);
				$('#'+index).find('img').attr('alt', name);	
				$('#'+index).find('h3').text(name);
				$('#'+index).find('a').data('artist', response);
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
				initArtistRoot(artist);
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

	var getArtistAndSetChild = function (index, node, artistId) {
		$.ajax({
			url: 'https://api.spotify.com/v1/artists/'+artistId,
			success: function(response) {
				d3Tree._addChild(node, response);
				if(index === CHILD_LIMIT-1) {
					d3Tree._updateAfterSetChildren(node);
				}
			}
		});
	}

	//use name from search dropdown to reset text value on input group
	window.searchName = function(searchName) {
		$('#search-artist').val(searchName);
		$('.suggest-nav').hide();
		$('#home-page').hide();
		$('#tree-view').show();
		$('#save').show();
		$('#rightpane').show();
		searchForArtist(searchName);
	}

	var initArtistRoot = function (artist) {
        d3Tree.setRoot(artist);
        $('#search-artist').val('');
    }

	var init = function() {
		$('#rightpane').height($(window).height());
		$('#rightpane').hide();
		$('#tree-view').hide();
		$('#save').hide();
		getMostPopularArtists();
	}

	init();

	$(window).resize(function() {
		d3Tree.resizeOverlay();
        var height = $(window).height();
        $('#rightpane').height(height);
	});

	$('.thumbnail a').click(function() {
		$('#home-page').hide();
		$('#tree-view').show();
		$('#save').show();
		$('#rightpane').show();
		initArtistRoot($(this).data('artist'));
	});

	$('#search-artist').on('input', function() {
		var input = $('#search-artist').val().trim();
		if(input) {
			suggestArtists(input);
		} else {
			$('.suggest-nav').hide();
		}
	});

	// $('#search-artist').submit(function(event) {
	// 	event.preventDefault();
	// 	$('#home-page').hide();
	// 	$('#tree-view').show();
	// 	$('#save').show();
	// 	$('#rightpane').show();
	// 	suggestArtists($('#search-field').val());
	// 	searchForArtist($('#search-field').val());
	// });

	$('#save-tree').click(function() {
		console.log(d3Tree.getRoot());
	});

	window.AT = {
		getSimilarArtistsForNode: getSimilarArtistsForNode,
		getTopTracksForArtist: getTopTracksForArtist
	};
}); //end of $(document).ready()
