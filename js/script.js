/* 
Practice with Spotify Web API and Echo Nest API

*/ 



$(document).ready(function() {

	function searchForArtist(artistName) {
		$.ajax({
			'url' : "https://api.spotify.com/v1/search?q=tania%20bowra&type=artist",
			'type' : 'GET',
			'dataType' : 'jsonp', 
			success: function(data) {
				console.log(data); 
			}
		});//end of ajax call

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

});  //end of $(document).ready() function
