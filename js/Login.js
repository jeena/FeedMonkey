function Login(app) {
	this.app = app;

	if(!this.is_logged_in()) {
		this.log_in();
		if(!this.onLine()) alert("You need to be on line to log in to your server.");
	}
	else this.app.after_login();
};

Login.prototype.onLine = function() {
	return navigator.onLine;
};

Login.prototype.is_logged_in = function() {
	return localStorage.server_url && localStorage.session_id;
};

Login.prototype.log_in = function() {
	$.mobile.changePage("#login", { role: "dialog", transition: "flip", "close-btn": "none" });
	$("#login form").on('submit', this.authenticate.bind(this));
};

Login.prototype.authenticate = function(e) {
	var server_url = $(e.target).find("#url").val();
	var user = $(e.target).find("#un").val();
	var password = $(e.target).find("#pw").val();

	if(!this.onLine()) {
		alert("You need to be on line to log in to your server.");
		return false;
	}

	var errs = [];
	if(!server_url || server_url.indexOf("http") != 0) errs.push("add a server url that starts with http");
	if(!user) errs.push("add a username");
	if(!password) errs.push("add a password");

	if(errs.length > 0) {
		alert("Please " + errs.join(",\n") + ".");
		return false;
	} 

	var _this = this;
	TinyTinyRSS.login(server_url, user, password, function(data) {
		if(data.error) {
			alert(data.error);
		} else {
			localStorage.server_url = server_url;
			localStorage.session_id = data.session_id;
			_this.app.after_login();
		}
	});

	return false;
};

Login.prototype.log_out = function() {
	localStorage.server_url = null;
	localStorage.session_id = null;
	localStorage.unread_articles = null;
	this.log_in();
}