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

	["read", "unread", "starred", "unstarred", "published", "unpublished"].forEach(function(type) {
		var articles = localStorage[type + "_articles"];
		if(articles) {
			var callback = function(ok) { if(ok) localStorage[type + "_articles"] = null }
			this.call("setArticles" + type.capitalize(), [JSON.parse(articles), callback]);
		}
	});
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
				if(xhr.status != 0) alert("error: " + xhr.status + " " + xhr.statusText);
				if(callback) callback(null);
			}
		}
	}
	xhr.open("POST", url, true);
	xhr.send(JSON.stringify(options));
}

TinyTinyRSS.prototype.reload = function(callback,limit, feedId) {
	this.getUnreadFeeds(callback, 0, limit, feedId);
};

TinyTinyRSS.prototype.getUnreadFeeds = function(callback, skip, limit, feedId) {
	skip = skip.length;
	var options = {
		show_excerpt: false,
		view_mode: "unread",
		show_content: true,
		feed_id: feedId || -4,
		limit: limit || 0,
		skip: skip || 0
	};

	this.doOperation("getHeadlines", options, callback);
}

TinyTinyRSS.prototype.getFeedsByCategory = function (categoryId, callback) {
	var options = {
		cat_id: categoryId,
		unread_only: true,
		include_nested: false
	};

	this.doOperation("getFeeds", options, callback);
};

TinyTinyRSS.prototype.setArticlesRead = function(articles, callback) {

	var options = {
		article_ids: articles.map(function(o) { return o.id }).join(","),
		mode: 0,
		field: 2
	};

	if (navigator.onLine) {
		this.doOperation("updateArticle", options, callback);
	} else {
		this.append("read_articles", articles);
	}
};

TinyTinyRSS.prototype.setArticleRead = function(article, callback) {
	this.setArticlesRead([article], callback);
};


TinyTinyRSS.prototype.setArticlesUnread = function(articles, callback) {

	var options = {
		article_ids: articles.map(function(o) { return o.id }).join(","),
		mode: 1,
		field: 2
	};

	if (navigator.onLine) {
		this.doOperation("updateArticle", options, callback);
	} else {
		this.append("unread_articles", articles);
	}
};

TinyTinyRSS.prototype.setArticleUnread = function(article, callback) {
	this.setArticlesUnread([article], callback);
};

TinyTinyRSS.prototype.setArticlesStarred = function(articles, callback) {

	var options = {
		article_ids: articles.map(function(o) { return o.id }).join(","),
		mode: 1,
		field: 0
	};

	if (navigator.onLine) {
		this.doOperation("updateArticle", options);
	} else {
		this.append("starred_articles", articles);
	}
};

TinyTinyRSS.prototype.setArticleStarred = function(article, callback) {
	this.setArticlesStarred([article], callback);
};

TinyTinyRSS.prototype.setArticlesUnstarred = function(articles, callback) {

	var options = {
		article_ids: articles.map(function(o) { return o.id}).join(","),
		mode: 0,
		field: 0
	};

	if (navigator.onLine) {
		this.doOperation("updateArticle", options, callback);
	} else {
		this.append("unstarred_articles", articles);
	}
};

TinyTinyRSS.prototype.setArticleUnstarred = function(article, callback) {
	this.setArticlesUnstarred([article], callback);
};

TinyTinyRSS.prototype.setArticlesPublished = function(articles, callback) {

	var options = {
		article_ids: articles.map(function(o) { return o.id }).join(","),
		mode: 1,
		field: 1
	};

	if (navigator.onLine) {
		this.doOperation("updateArticle", options);
	} else {
		this.append("published_articles", articles);
	}
};

TinyTinyRSS.prototype.setArticlePublished = function(article, callback) {
	this.setArticlesPublished([article], callback);
};

TinyTinyRSS.prototype.setArticlesUnpublished = function(articles, callback) {

	var options = {
		article_ids: articles.map(function(o) { return o.id}).join(","),
		mode: 0,
		field: 1
	};

	if (navigator.onLine) {
		this.doOperation("updateArticle", options, callback);
	} else {
		this.append("unpublished_articles", articles);
	}
};

TinyTinyRSS.prototype.setArticleUnpublished = function(article, callback) {
	this.setArticlesUnpublished([article], callback);
};

TinyTinyRSS.prototype.getCategories = function (callback) {
	var options = {
		unread_only: true,
		enable_nested: false,
		include_empty: false
	};
	this.doOperation("getCategories", options, callback);
}

TinyTinyRSS.prototype.append = function(key, array) {
	var tmp = localStorage[key];

	if (typeof tmp !== "undefined") tmp = JSON.parse(tmp);
	else tmp = [];

	tmp.concat(array);
	localStorage[key] = JSON.stringify(tmp);
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
				if(xhr.status == 0) {
					alert("Something went wrong, please check your credentials and the server address")
				} else {
					alert("error: " + xhr.status + " " + xhr.statusText)
				}
			}
		}
	}
	xhr.open("POST", url, true);
	xhr.send(JSON.stringify(options));
}
