$(document).ready(function() {
	var ECHO_NEST_API_KEY = 'PF5AWHKSEDOEJ6IXM';
	var CHILD_LIMIT = 5;

    var spotifyPlayTemplateSource = $('#spotify-play-template').html();
    var spotifyPlayTemplate = Handlebars.compile(spotifyPlayTemplateSource);
    var suggestResultsTemplateSource = $('#suggest-results-template').html();
	var suggestResultsTemplate = Handlebars.compile(suggestResultsTemplateSource); 
	var savedTreesTemplateSource = $('#saved-trees-template').html();
	var savedTreesTemplate = Handlebars.compile(savedTreesTemplateSource);

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
				results: 100,
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
                var similarArtists = data.response.artists.slice(0, CHILD_LIMIT);
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

    var initDataRoot = function (dataKey) {
        d3Tree.setRootData(store.get(dataKey));
        var artist = store.get(dataKey).artist;
        getTopTracksForArtist(artist.name, artist.id, artist.images[2].url);
    }

	var init = function() {
		$('#rightpane').height($(window).height());
		if(!store.enabled) {
            alert('Local storage is not supported by your browser. To save data and view previously saved data, please disable "Private Mode", or upgrade to a modern browser.');
        }
		if(jQuery.isEmptyObject(store.getAll())) {
			$('#rightpane').hide();
		}
		else {
			$('#rightpane').html(savedTreesTemplate(store.getAll()));
			$('#clear-trees').click(function() {
				store.clear();
				$('#rightpane').hide();
			});
		}
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

	$('#save-tree-modal').on('shown.bs.modal', function() {
		$('#new-tree-name').focus();
	});

	$('#save-tree-modal').on('show.bs.modal', function() {
		$('#new-tree-name').val('');
		$('#tree-saved-alert').hide();
	});

	$('#new-tree-name').on('input', function() {
		var newTreeName = $('#new-tree-name').val().trim();
		if(newTreeName !== '') {
			$('#no-name-error').hide();
		}
		if(newTreeName.length <= 30) {
			$('#long-name-error').hide();
		}
		if(!(newTreeName in store.getAll())) {
			$('#tree-exists-error').hide();
		}
	});

	$('#name-tree').submit(function(event) {
		event.preventDefault();
		var newTreeName = $('#new-tree-name').val().trim();
		if(newTreeName === '') {
			$('#no-name-error').show();
		} else if(newTreeName.length > 30) {
			$('#long-name-error').show();
		} else if(newTreeName in store.getAll()) {
			$('#tree-exists-error').show();
		} else {
			store.set(newTreeName, d3Tree.getRoot());
			$('#tree-saved-alert').show();
			$('#tree-saved-alert').fadeOut('slow', function() {
				$('#save-tree-modal').modal('hide');
  			});
		}
	});

	$('.saved-tree').click(function() {
		$('#home-page').hide();
		$('#tree-view').show();
		$('#save').show();
		$('#rightpane').show();
		initDataRoot($(this).text());
	});

	var showingHelpPopOver = false;
	$('body').on('click', function (e) {
	    if(e.toElement.id == 'help-instruction'){
	    	$('.popup').fadeIn(500);
			$('[data-toggle="popover"]').popover('show');
			showingHelpPopOver = true;
	    }
	    else{ 
	    	if(!showingHelpPopOver)
	    		$('[data-toggle="popover"]').popover('hide');
	    }
	});

	$('.popup-inner').click(function() {
		$('.popup').fadeOut(500);
		$('[data-toggle="popover"]').popover('hide');
		showingHelpPopOver = false;
	});

	window.AT = {
		getSimilarArtistsForNode: getSimilarArtistsForNode,
		getTopTracksForArtist: getTopTracksForArtist
	};
}); //end of $(document).ready()
