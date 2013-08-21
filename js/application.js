function debug(obj) {
	if(typeof obj != "string")
		obj = JSON.stringify(obj);
	
	alert(obj)
}

// Handle login stuff if needed
$(document).on("pageshow", function() {
	if(!window.app) window.app = new App();
});

// Listen for any attempts to call changePage().
$(document).bind( "pagebeforechange", function( e, data ) {

	// We only want to handle changePage() calls where the caller is
	// asking us to load a page by URL.
	if ( typeof data.toPage === "string" ) {

		// We are being asked to load a page by URL, but we only
		// want to handle URLs that request the data for a specific
		// category.
		var u = $.mobile.path.parseUrl( data.toPage ),
			re = /^#full-/;

		if ( u.hash.search(re) !== -1 ) {

			// We're being asked to display the items for a specific category.
			// Call our internal method that builds the content for the category
			// on the fly based on our in-memory category data structure.
			var i = parseInt(u.hash.split("-")[1], 10);
			app.showFull(app.unread_articles[i], false);

			// Make sure to tell changePage() we've handled this call so it doesn't
			// have to do anything.
			e.preventDefault();
		}
	}
});