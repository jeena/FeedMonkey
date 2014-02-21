function Pond(app, server_url, session_token) {
	this.app = app;
	this.server_url = server_url;
	this.session_token = session_token;
	this.feeds = {};
	var feeds = localStorage.feeds;
	if(feeds) this.feeds = JSON.parse(feeds);

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

Pond.prototype.doOperation = function(method, operation, new_options, callback) {
	if(!navigator.onLine) {
		callback(null);
		return;
	}

	var url = this.server_url + "/api/" + operation;
	var options = {};
	
	for (var key in new_options) {
		options[key] = new_options[key];
	}

	var a = [];
	for(var key in options) {
		a.push(key + "=" + options[key]);
	}
	var body = "";
	if(method == "GET" || method == "HEAD" || method == "PUT") { // FIXME: in future remove put from here
		url += "?" + a.join("&");
	} else {
		body = a.join("&");
	}

	var xhr = new XMLHttpRequest({mozSystem: true});
	xhr.onreadystatechange = function() {
		if(xhr.readyState == 4) {
			if(xhr.status == 200) {
				if(callback)
					callback(JSON.parse(xhr.responseText));
			} else {
				if(xhr.status != 0) alert("error: " + xhr.status + " " + xhr.statusText);
				if(callback) callback(null);
			}
		}
	}

	xhr.open(method, url, true);
	xhr.withCredentials = true;
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.setRequestHeader("Content-Length", body.length);
	xhr.setRequestHeader("Connection", "close");
	xhr.setRequestHeader('X-Session-Token', this.session_token);
	xhr.send(body);
};


Pond.prototype.reload = function(callback) {
 	var _this = this;
	this.getFeeds(function() { _this.getUnreadFeeds(callback); });
 };

Pond.prototype.getUnreadFeeds = function(callback, skip) {
	var options = {
		status: "unread",
		limit: 100
	};

	if(skip && skip.length > 0) {
		options.before_id = skip[skip.length - 1].id
	}

	var _this = this;
	this.doOperation("GET", "subscriptions/articles", options, function(items) {

		if(!items) items = []; // So it can run the last callback

		function isFeedAvailable(o) {
			return !!_this.feeds[o.feedId];
		}

		if(items.every(isFeedAvailable)) {
			callback(items.map(_this.normalizeArticle, _this));
		} else {
			_this.getFeeds(function() {
				callback(items.map(_this.normalizeArticle, _this));
			});
		}
	});
}

Pond.prototype.getFeeds = function(callback) {
	var _this = this;
	this.doOperation("GET", "subscriptions", {}, function(feeds) {
		
		_this.feeds = {};
		for (var i = 0; i < feeds.length; i++) {
			var feed = feeds[i];
			_this.feeds[feed.id] = feed;
		}

		localStorage.feeds = JSON.stringify(_this.feeds);
		callback();
	});
};

Pond.prototype.normalizeArticle = function(article) {
	var feed = this.feeds[article.subscription_id];
	var feed_title = "";
	if(feed) {
		feed_title = feed.name;
	}

	var content;
	if(article.body.type == "text") content = article.body.content.replace(/\n/, "<br>");
	else content = article.body.content.htmlDecode();

	var excerpt = article.summary.content.htmlDecode();
	if(!excerpt || excerpt.length < 1) excerpt = content;
	
	var timestamp = new Date(article.published_at).getTime() / 1000;

	return {
		id: article.id,
		guid_hash: article.url + article.id,
		title: article.title,
		content: content,
		feed_title: feed_title,
		feed_id: article.subscription_id,
		excerpt: excerpt.stripHTML().substring(0, 100),
		updated: timestamp,
		link: article.url,
		marked: false, // not implemented in Pond server yet
		unread: !article.read
	}
};


Pond.prototype.setArticleStatus = function(article, callback, status) {
	var options = {
		status: status
	};

	var url = "subscriptions/" + article.feed_id + "/articles/" + article.id

	if (navigator.onLine) this.doOperation("PUT", url, options, callback);
	else {
		this.append("unread_articles", articles);
	}
	
}

Pond.prototype.setArticleRead = function(article, callback) {
	this.setArticleStatus(article, callback, "read");
}

Pond.prototype.setArticleUnread = function(article, callback) {
	this.setArticleStatus(article, callback, "unread");
}

Pond.prototype.setArticlesRead = function(articles, callback) {
	articles.forEach(function(article) {
		this.setArticleStatus(article, callback, "read");
	})
}

Pond.prototype.setArticlesUnread = function(articles, callback) {
		articles.forEach(function(article) {
		this.setArticleStatus(article, callback, "unread");
	})
}

Pond.prototype.setArticleStarred = function(article, callback) {
	// not implemented yet in Pond
}

Pond.prototype.setArticleUnstarred = function(articles, callback) {
	// not implemented yet in Pond
}

Pond.prototype.logOut = function() {
	this.doOperation("DELETE", "auth/sessions/" + this.session_token );
	localStorage.feeds = null;
}

Pond.prototype.getFeedFor = function(o) {
	return this.feeds[o.subscription_id];
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