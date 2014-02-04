function Pond(app, server_url, session_token) {
	this.app = app;
	this.server_url = server_url;
	this.session_token = session_token;

	window.addEventListener("offline", this.onoffline.bind(this));
	window.addEventListener("online", this.ononline.bind(this));
}

Pond.prototype.onoffline = function() {
	// Do nothing
};

Pond.prototype.ononline = function() {
	// Send read
};

Pond.prototype.toString = function() {
	return "Pond"
};

Pond.login = function(server_url, user, password, callback) {
	
	var url = server_url + "/api/auth/sessions";
	var password_hash = md5(user + ':' + password)
	var options = "username=" + user.toLowerCase() + "&" + "password=" + password_hash;

	var xhr = new XMLHttpRequest({mozSystem: true});
	xhr.onreadystatechange = function() {
		if(xhr.readyState == 4) {
			if(xhr.status == 201) {
				callback(JSON.parse(xhr.responseText))
			} else {
				alert("error: " + typeof(xhr.status) + " " + xhr.statusText + "\n\n" + xhr.responseText)
			}
		}
	}
	xhr.open("POST", url, true);
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.setRequestHeader("Content-Length", options.length);
	xhr.setRequestHeader("Connection", "close");
	xhr.send(options);
}