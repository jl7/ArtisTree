var ECHO_NEST_API_KEY = 'PF5AWHKSEDOEJ6IXM';

var suggestArtistsData = []; 


$(document).ready(function() {
	
	var treeViewHTML = 
		'<div id="tree-view"></div>' +
		'<div id="save">' +
      		'<button type="button" class="btn btn-primary btn-sm">' +
	    		'Save this tree' +
      		'</button>' +
    	'</div>';


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

	var init = function() {
		$('#rightpane').hide();
		getMostPopularArtists();
	}

	init();


	$('.suggest-holder input').on('input', function() {
			suggestArtistsData = []; 
			suggestArtists($('#search-field').val());

	});


	// $('#search-artist').submit(function(event) {
	// 	event.preventDefault();
	// 	suggestArtists($('#search-field').val());
	// });


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
				console.log(response); 
			}
		});
	}


	//Get Related Aritists 
	//GET https://api.spotify.com/v1/artists/{id}/related-artist 
	// function getRelatedArtists(artist_id){
	// 	//GET /users/user-id
	// 	$.ajax({
	// 		'url' : "https://api.spotify.com/v1/artists/"+artist_id+"/related-artist",
	// 		'type' : 'GET',	
	// 		'dataType' : 'jsonp',
	// 		success: function(data) {
	// 			console.log(data); 

	// 		}
	// 	}); //end of ajax call
	// }

}); //end of $(document).ready(function() 



var suggestArtists = function (query) {

		$.ajax({
			url: 'http://developer.echonest.com/api/v4/artist/suggest',
			data: {
				api_key: ECHO_NEST_API_KEY,
				results: 15,
				q: query,
			},
			success: function(data) {

				var suggestedArtists = data.response.artists;
				console.log(suggestedArtists); 

				for(var i=0, l=suggestedArtists.length; i<l; i++) {
					var theTemplateScript = $("#suggest-result-template").html();
					var theTemplate = Handlebars.compile(theTemplateScript); 
					//get name when item is clicked on dropdown menu 
					Handlebars.registerHelper('json', function(context) {
					    return JSON.stringify(context);
					});

					// Clear the ul
					$(".suggestNav").empty(theTemplate());

   					$(".suggestNav").append(theTemplate(suggestedArtists));
   				}
   				   $('.suggest-holder ul').show();

   			}
    });
}

//use name from search dropdown to reset text value on input group
var passSearchName = function(searchName) {
	$("#search-field").val(searchName); 
}
		
