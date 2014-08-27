function OwnCloud(app, server_url, user_pass_btoa) {
	this.app = app;
	this.server_url = server_url;
	this.session_id = user_pass_btoa;
	this.feeds = {};
	var feeds = localStorage.feeds;
	if(feeds) this.feeds = JSON.parse(feeds);
	
	window.addEventListener("offline", this.onoffline.bind(this));
	window.addEventListener("online", this.ononline.bind(this));
}

OwnCloud.prototype.onoffline = function() {
	// Do nothing
};

OwnCloud.prototype.ononline = function() {

	["read", "unread", "starred", "unstarred"].forEach(function(type) {
		var articles = localStorage[type + "_articles"];
		if(articles) {
			var callback = function(ok) { if(ok) localStorage[type + "_articles"] = null }
			this.call("setArticles" + type.capitalize(), [JSON.parse(articles), callback]);
		}
	});
};

OwnCloud.prototype.doOperation = function(method, operation, new_options, callback) {
	if(!navigator.onLine) {
		callback(null);
		return;
	}

	var url = this.server_url + "/index.php/apps/news/api/v1-2/" + operation;
	var options = {};
	
	for (var key in new_options) {
		options[key] = new_options[key];
	}

	if(method == "GET" || method == "HEAD") {
		var a = [];
		for(var key in options) {
			a.push(key + "=" + options[key]);
		}
		url += "?" + a.join("&");
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
	xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	xhr.withCredentials = true;
	xhr.setRequestHeader('Authorization', 'Basic ' + this.session_id);
	var body = JSON.stringify(options);
	xhr.send(body);
}

OwnCloud.prototype.reload = function(callback,limit) {
	var _this = this;
	this.getFeeds(function() { _this.getUnreadFeeds(callback,0,limit); });
};

OwnCloud.prototype.getUnreadFeeds = function(callback, skip, limit) {
	if(skip) {
		skip = skip[skip.length - 1].id;
	}

	var options = {
		batchSize: limit || 700,
		offset: skip || 0,
		type: 3,
		id: 0,
		getRead: false
	};

	var _this = this;
	this.doOperation("GET", "items", options, function(data) {
		
		var items = data.items;

		function isFeedAvailable(o) {
			return !!_this.feeds[o.feedId];
		}

		if(items.every(isFeedAvailable)) {
			callback(items.map(_this.normalize_article, _this));
		} else {
			_this.getFeeds(function() {
				callback(items.map(_this.normalize_article, _this));
			});
		}
	});
};


OwnCloud.prototype.toString = function() {
	return "OwnCloud"
};

OwnCloud.prototype.getFeeds = function(callback) {
	var _this = this;
	this.doOperation("GET", "feeds", {}, function(data) {
		
		_this.feeds = {};
		for (var i = 0; i < data.feeds.length; i++) {
			var feed = data.feeds[i];
			_this.feeds[feed.id] = feed;
		}

		localStorage.feeds = JSON.stringify(_this.feeds);
		callback();
	});
};

OwnCloud.prototype.setArticlesRead = function(articles, callback) {

	var options = {
		items: articles.map(function(o) { return o.id; }),
	};

	if (navigator.onLine) {
		this.doOperation("PUT", "items/read/multiple", options, callback);
	} else {
		this.append("read_articles", articles);
	}
}

OwnCloud.prototype.setArticleRead = function(article, callback) {
	this.setArticlesRead([article], callback);
}

OwnCloud.prototype.setArticlesUnread = function(articles, callback) {
	
	var options = {
		items: articles.map(function(o) { return o.id; }),
	};

	if (navigator.onLine) this.doOperation("PUT", "items/unread/multiple", options, callback);
	else {
		this.append("unread_articles", articles);
	}
};

OwnCloud.prototype.setArticleUnread = function(article, callback) {
	this.setArticlesUnread([article], callback);
}

OwnCloud.prototype.setArticlesStarred = function(articles, callback) {
	
	var options = {
		items: articles.map(function(o) { return { feedId: o.feed_id, guidHash: o.guid_hash }; })
	};

	if (navigator.onLine) {
		this.doOperation("PUT", "items/star/multiple", options, callback);
	} else {
		this.append("starred_articles", articles);
	}
};

OwnCloud.prototype.setArticleStarred = function(article, callback) {
	this.setArticlesStarred([article], callback);
}

OwnCloud.prototype.setArticlesUnstarred = function(articles, callback) {

	var options = {
		items: articles.map(function(o) { return { feedId: o.feed_id, guidHash: o.guid_hash }; })
	};

	if (navigator.onLine) {
		this.doOperation("PUT", "items/unstar/multiple", options, callback);
	} else {
		this.append("unstarred_articles", articles);
	}
};

OwnCloud.prototype.setArticleUnstarred = function(articles, callback) {
	this.setArticlesUnstarred([articles], callback);
}

OwnCloud.prototype.normalize_article = function(article) {
	var feed = this.feeds[article.feedId];
	var feed_title = "";
	if(feed) {
		feed_title = feed.title;
	}

	return {
		id: article.id,
		guid_hash: article.guidHash,
		title: article.title,
		content: article.body,
		feed_title: feed_title,
		feed_id: article.feedId,
		excerpt: article.body.stripHTML().substring(0, 100),
		updated: article.pubDate,
		link: article.link,
		marked: article.starred,
		unread: article.unread
	}
};

OwnCloud.prototype.logOut = function() {
	this.doOperation("logout");
	localStorage.feeds = null;
};

OwnCloud.prototype.getFeedFor = function(o) {
	return this.feeds[o.feedId];
};

OwnCloud.prototype.append = function(key, array) {

	var tmp = localStorage[key];

	if (typeof tmp !== "undefined") tmp = JSON.parse(tmp);
	else tmp = [];

	tmp.concat(array);
	localStorage[key] = JSON.stringify(tmp);
};

OwnCloud.login = function(server_url, user, password, callback) {
	
	var url = server_url + "/index.php/apps/news/api/v1-2/version";

	var xhr = new XMLHttpRequest({mozSystem: true});
	xhr.onreadystatechange = function() {
		if(xhr.readyState == 4) {
			if(xhr.status == 200) {
				callback(JSON.parse(xhr.responseText))
			} else {
				if(xhr.status == 0) {
					alert("Something went wrong, please check your credentials and the server address")
				} else {
					alert("error: " + xhr.status + " " + xhr.statusText);
				}
			}
		}
	}

	xhr.open("GET", url, true);
	xhr.withCredentials = true;
	var auth = btoa(user + ':' + password);
	xhr.setRequestHeader('Authorization', 'Basic ' + auth);
	xhr.send();
}
