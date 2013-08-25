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
	this.app.changeToPage("#login");
	$("#login form").addEventListener('submit', this.authenticate.bind(this));
};

Login.prototype.authenticate = function(e) {
	// do not reload page
	e.preventDefault();
 	e.stopPropagation();

	var server_url = $("#url").value;
	var user = $("#un").value;
	var password = $("#pw").value;

	if(!this.onLine()) {
		alert("You need to be on line to log in to your server.");
		return false;
	}

	var errs = [];
	if(!server_url || server_url.indexOf("http") != 0) errs.push("add a server url that starts with http");
	if((user && !password) || (!user && password)) errs.push("add both username and password or neither");

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
			
			$("#url").value = "";
			$("#un").value = "";
			$("#pw").value = "";
		}
	});

	return false;
};

Login.prototype.log_out = function() {
	localStorage.removeItem("server_url");
	localStorage.removeItem("session_id");
	localStorage.removeItem("unread_articles");
	this.log_in();
}