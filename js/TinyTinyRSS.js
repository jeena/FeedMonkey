function TinyTinyRSS(app, server_url, session_id) {
	this.app = app;
	this.server_url = server_url;
	this.session_id = session_id;

	window.addEventListener("offline", this.onoffline.bind(this));
	window.addEventListener("online", this.ononline.bind(this));
}

TinyTinyRSS.prototype.onoffline = function() {
	// Do nothing
};

TinyTinyRSS.prototype.ononline = function() {
	var read_articles = localStorage.read_articles;
	if (typeof read_articles !== "undefined") {
		read_articles = JSON.parse(localStorage.read_articles);
		this.setArticleRead(read_articles.join(","), function() {
			localStorage.read_articles = null;
		});
	}

	var unread_articles = localStorage.unread_articles;
	if (unread_articles) {
		unread_articles = JSON.parse(unread_articles);
		this.setArticleUnread(unread_articles.join(","), function() {
			localStorage.unread_articles();
		});		
	}
};

TinyTinyRSS.prototype.doOperation = function(operation, new_options, callback) {
	if(!navigator.onLine) {
		callback(null);
		return;
	}

	var url = this.server_url + "/api/";
	var options = {
		sid: this.session_id,
		op: operation
	};
	
	for (var key in new_options) {
		options[key] = new_options[key];
	}

	var xhr = new XMLHttpRequest({mozSystem: true});
	xhr.onreadystatechange = function() {
		if(xhr.readyState == 4) {
			if(xhr.status == 200) {
				if(callback)
					callback(JSON.parse(xhr.responseText).content);
			} else {
				alert("error: " + xhr.status + " " + xhr.statusText);
				if(callback)
					callback(null);
			}
		}
	}
	xhr.open("POST", url, true);
	xhr.send(JSON.stringify(options));
}

TinyTinyRSS.prototype.getUnreadFeeds = function(callback, skip) {
	var options = {
		show_excerpt: false,
		view_mode: "unread",
		show_content: true,
		feed_id: -4,
		skip: skip || 0
	};

	this.doOperation("getHeadlines", options, callback);
}

TinyTinyRSS.prototype.setArticleRead = function(article_id) {
	var options = {
		article_ids: article_id,
		mode: 0,
		field: 2
	};

	if (navigator.onLine) this.doOperation("updateArticle", options);
	else {
		var read_articles = localStorage.read_articles;
		if(typeof read_articles !== "undefined") read_articles = JSON.parse(read_articles);
		else read_articles = [];
		read_articles.push(article_id);
		localStorage.read_articles = JSON.stringify(read_articles);
	}
};

TinyTinyRSS.prototype.setArticleUnread = function(article_id) {
	var options = {
		article_ids: article_id,
		mode: 1,
		field: 2
	};

	if (navigator.onLine) this.doOperation("updateArticle", options);
	else {
		var unread_articles = localStorage.unread_articles;
		if (typeof unread_articles !== "undefined") unread_articles = JSON.parse(unread_articles);
		else unread_articles = [];
		unread_articles.push(article_id);
		localStorage.unread_articles = JSON.stringify(unread_articles);
	}
};

TinyTinyRSS.prototype.logOut = function() {
	this.doOperation("logout");
};

TinyTinyRSS.login = function(server_url, user, password, callback) {
	
	var url = server_url + "/api/";
	var options = {op: "login", user: user, password: password};

	var xhr = new XMLHttpRequest({mozSystem: true});
	xhr.onreadystatechange = function() {
		if(xhr.readyState == 4) {
			if(xhr.status == 200) {
				callback(JSON.parse(xhr.responseText).content)
			} else {
				alert("error: " + xhr.status + " " + xhr.statusText)
			}
		}
	}
	xhr.open("POST", url, true);
	xhr.send(JSON.stringify(options));
}