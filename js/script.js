$(document).ready(function() {
	var ECHO_NEST_API_KEY = 'PF5AWHKSEDOEJ6IXM';
	var CHILD_LIMIT = 5;

    var spotifyPlayTemplateSource = $('#spotify-play-template').html();
    var spotifyPlayTemplate = Handlebars.compile(spotifyPlayTemplateSource);
    var suggestResultsTemplateSource = $('#suggest-results-template').html();
	var suggestResultsTemplate = Handlebars.compile(suggestResultsTemplateSource); 
	var savedTreesTemplateSource = $('#saved-trees-template').html();
	var savedTreesTemplate = Handlebars.compile(savedTreesTemplateSource);

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
	};

	var suggestArtists = function (query) {
		$.ajax({
			url: 'http://developer.echonest.com/api/v4/artist/suggest',
			data: {
				api_key: ECHO_NEST_API_KEY,
				results: 15,
				q: query
			},
			success: function(data) {
				if(data.response.artists.length > 0) {
	   				$('.suggest-nav').html(suggestResultsTemplate(data.response));
	   				resetActiveIndex(true);
	   				$('.suggest-result').hover(function() {
	   					var activeIndex = $('.suggest-nav').data('activeIndex');
						var maxIndex = $('.suggest-nav').children('li').length;
						if(activeIndex < maxIndex) {
							$('.suggest-nav').children('li').eq(activeIndex).css('background-color', 'white');
						}
	   					$(this).css('background-color', 'rgba(0,120,0, .2)');
	   					$('.suggest-nav').data('activeIndex', $(this).index());
	   				}, function() {
	   					var activeIndex = $('.suggest-nav').data('activeIndex');
	   					if(activeIndex === $(this).index()) {
	   						var maxIndex = $('.suggest-nav').children('li').length;
	   						$(this).css('background-color', 'white');
	   						$('.suggest-nav').data('activeIndex', maxIndex);
	   					}
	   				});
					$('.suggest-result').click(function() {
						var searchName = $(this).text();
						$('#search-artist').val(searchName);
						$('.suggest-nav').html('');
						resetActiveIndex(true);
						$('.suggest-nav').hide();
						searchForArtist(searchName);
						$('#home-page').hide();
						$('#tree-page').show();
						$('#change').hide();
					});
	   				$('.suggest-nav').show();
   				} else {
					$('.suggest-nav').html('');
					resetActiveIndex(true);
   					$('.suggest-nav').hide();
   				}
   			}
	    });
	};

	var getSimilarArtistsForNode = function (node, exploredArtistIds) {
		$.ajax({
			url: 'http://developer.echonest.com/api/v4/artist/similar',
			data: {
				api_key: ECHO_NEST_API_KEY,
				id: node.artist.uri,
				results: 100,
				bucket: ['hotttnesss_rank','id:spotify'],
				limit: true
			},
			traditional: true,
			success: function(data) {
				if(data.response.artists) {
					if(data.response.artists.length > 0) {
						data.response.artists.sort(function (a, b) {
		                    return a.hotttnesss_rank-b.hotttnesss_rank;
		                });
		                data.response.artists = data.response.artists.filter(function (artist) {
		                    return exploredArtistIds.indexOf(artist.foreign_ids[0].foreign_id.slice(15)) === -1;
		                });
		                var similarArtists = data.response.artists.slice(0, CHILD_LIMIT);
		                for(var i=0, l=similarArtists.length; i<l; i++) {
							getArtistAndSetChild(node, similarArtists[i].foreign_ids[0].foreign_id.slice(15));
						}
					}
				}
			}
		});
	};

	var getArtistData = function (index, artistId) {
		$.ajax({
			url: 'https://api.spotify.com/v1/artists/'+artistId,
			success: function(response) {
				var name = response.name;
				$('#'+index).find('img').attr('src', getImage(response.images));
				$('#'+index).find('img').attr('alt', name);	
				$('#'+index).find('h3').text(name);
				$('#'+index).find('a').data('artist', response);
			}
		});
	};

	var searchForArtist = function (artistName) {
		$.ajax({
			url: 'https://api.spotify.com/v1/search',
			data: {
				q: artistName,
				type: 'artist'
			},
			success: function(response) {
				if(response.artists.items.length > 0) {
					var artist = response.artists.items[0];
					initArtistRoot(artist);
					$('#tree-heading').text('');
					$('#tree-view').show();
					$('#save').show();
					$('#rightpane').show();
				} else {
					$('#tree-heading').text('No data found for given artist name, please check spelling.');
					$('#tree-view').hide();
					$('#save').hide();
					$('#rightpane').hide();
				}
			}
		});
	};

	var getTopTracksForArtist = function (artist) {
		$.ajax({
			url: 'https://api.spotify.com/v1/artists/'+artist.id+'/top-tracks',
			data: {
				country: 'US'
			},
			success: function(response) {
				var imageUrl = getImage(artist.images);
				if(imageUrl === 'img/spotify.jpeg') {
					$('#rightpane').html(spotifyPlayTemplate({name: artist.name, tracks: response.tracks}));
				} else {
					$('#rightpane').html(spotifyPlayTemplate({name: artist.name, url: imageUrl, tracks: response.tracks}));
				}
			}
		});
	};

	var getArtistAndSetChild = function (node, artistId) {
		$.ajax({
			url: 'https://api.spotify.com/v1/artists/'+artistId,
			success: function(response) {
				if(response.id) {
					d3Tree._addChild(node, response);
				}
			}
		});
	};

	var initArtistRoot = function (artist) {
        d3Tree.setRoot(artist);
        $('#search-artist').val('');
    };

    var initDataRoot = function (dataKey) {
        d3Tree.setRootData(store.get(dataKey));
        var artist = store.get(dataKey).artist;
        getTopTracksForArtist(artist);
    };

	var resetActiveIndex = function(suggestionsChanged) {
		var activeIndex = $('.suggest-nav').data('activeIndex');
		var maxIndex = $('.suggest-nav').children('li').length;
		if(!suggestionsChanged) {
			if(activeIndex < maxIndex) {
				$('.suggest-nav').children('li').eq(activeIndex).css('background-color', 'white');
			}
		}
		$('.suggest-nav').data('activeIndex', maxIndex);
	};

	var getImage = function(images) {
		var length = images.length;
        if(length === 0) {
            return 'img/spotify.jpeg';
        }
        if(length > 1) {
            return images[length - 2].url;
        }
        return images[length - 1].url;
    };

	var init = function() {
		if(!store.enabled) {
            alert('Local storage is not supported by your browser. To save data and view previously saved data, please disable "Private Mode", or upgrade to a modern browser.');
        }
		$('#rightpane').height($(window).height());
		$('#rightpane').hide();
		$('#tree-page').hide();
		getMostPopularArtists();
	};

	init();

	$(window).resize(function() {
		d3Tree.resizeOverlay();
        var height = $(window).height();
        $('#rightpane').height(height);
	});

	$('.thumbnail a').click(function() {
		initArtistRoot($(this).data('artist'));
		$('#home-page').hide();
		$('#tree-page').show();
		$('#change').hide();
		$('#rightpane').show();
	});

	$('#search-artist').on('input', function() {
		var input = $('#search-artist').val().trim();
		if(input) {
			suggestArtists(input);
		} else {
			$('.suggest-nav').html('');
			resetActiveIndex(true);
			$('.suggest-nav').hide();
		}
	});

	$('#search-artist').keydown(function(event) {
		if(event.which === 40) {
			var activeIndex = $('.suggest-nav').data('activeIndex');
			var $suggestions = $('.suggest-nav').children('li');
			var maxIndex = $suggestions.length;
			if(activeIndex < maxIndex) {
				$suggestions.eq(activeIndex).css('background-color', 'white');
			}	
			activeIndex = (activeIndex + 1) % (maxIndex + 1);
			if(activeIndex !== maxIndex) {
				$suggestions.eq(activeIndex).css('background-color', 'rgba(0,120,0, .2)');
			}
			$('.suggest-nav').data('activeIndex', activeIndex);
		}
		if(event.which === 38) {
			var activeIndex = $('.suggest-nav').data('activeIndex');
			var $suggestions = $('.suggest-nav').children('li');
			var maxIndex = $suggestions.length;
			if(activeIndex < maxIndex) {
				$suggestions.eq(activeIndex).css('background-color', 'white');
			}
			activeIndex = activeIndex - 1;
			if(activeIndex < 0) {
				activeIndex = maxIndex + 1 + activeIndex;
			}
			if(activeIndex !== maxIndex) {
				$suggestions.eq(activeIndex).css('background-color', 'rgba(0,120,0, .2)');
			}
			$('.suggest-nav').data('activeIndex', activeIndex);
		}
		if(event.which === 13) {
			var activeIndex = $('.suggest-nav').data('activeIndex');
			var $suggestions = $('.suggest-nav').children('li');
			var maxIndex = $suggestions.length;
			if(activeIndex < maxIndex) {
				var searchName = $('.suggest-nav').children('li').eq(activeIndex).text();
				$('#search-artist').val(searchName);
				$('.suggest-nav').html('');
				resetActiveIndex(true);
				$('.suggest-nav').hide();
				searchForArtist(searchName);
				$('#home-page').hide();
				$('#tree-page').show();
				$('#change').hide();
			}
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

	$('#delete-tree').click(function() {
		store.remove($('#tree-heading').text());
	});

	$('#change-tree').click(function() {
		store.set($('#tree-heading').text(), d3Tree.getRoot());
		$alert = $(this).next('div.alert');
		$alert.show();
		$alert.fadeOut('slow');
	});

	$('#clear-trees').click(function() {
		store.clear();
		$('#saved-trees-modal').modal('hide');
	});

	$('#saved-trees-modal').on('show.bs.modal', function() {
		if(jQuery.isEmptyObject(store.getAll())) {
			$('#clear-trees').hide();
			$('#saved-trees-body').html('');
		} else {
			$('#clear-trees').show();
			$('#saved-trees-body').html(savedTreesTemplate(store.getAll()));
			$('.saved-tree').click(function() {
				var treeName = $(this).text();
				initDataRoot(treeName);
				$('#home-page').hide();
				$('#tree-page').show();
				$('#tree-heading').text(treeName);
				$('#tree-view').show();
				$('#save').show();
				$('#change').show();
				$('#rightpane').show();
				$('#saved-trees-modal').modal('hide');
			});
		}
	});

	var showingHelpPopOver = false;
	$('body').on('click', function (e) {
	    if(e.toElement.id == 'help-instruction'){
	    	$('.popup').fadeIn(500);
			$('[data-toggle="popover"]').popover('show');
			showingHelpPopOver = true;
	    }
	    else{ 
	    	if(!showingHelpPopOver) {
	    		$('[data-toggle="popover"]').popover('hide');
	    	}
	    }
	});

	$('.popup-inner').click(function() {
		$('.popup').fadeOut(500);
		$('[data-toggle="popover"]').popover('hide');
		showingHelpPopOver = false;
	});

	window.AT = {
		getSimilarArtistsForNode: getSimilarArtistsForNode,
		getTopTracksForArtist: getTopTracksForArtist,
		getImage: getImage
	};
}); //end of $(document).ready()
