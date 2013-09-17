function OwnCloud(app, server_url, user_pass_btoa) {
	this.app = app;
	this.server_url = server_url;
	this.session_id = user_pass_btoa;

	window.addEventListener("offline", this.onoffline.bind(this));
	window.addEventListener("online", this.ononline.bind(this));
}

OwnCloud.prototype.onoffline = function() {
	// Do nothing
};

OwnCloud.prototype.ononline = function() {
	var read_articles = localStorage.read_articles;
	if (read_articles ) {
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

	var xhr = new XMLHttpRequest();
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
	//var auth = btoa(user + ':' + password);
	xhr.setRequestHeader('Authorization', 'Basic ' + this.session_id);
	xhr.send(JSON.stringify(options));
}

OwnCloud.prototype.getUnreadFeeds = function(callback, skip) {
	if(skip) {
		skip = skip[skip.length - 1].id;
	}

	var options = {
		batchSize: 700,
		offset: skip || 0,
		type: 3,
		id: 0,
		getRead: false
	};

	var _this = this;
	this.doOperation("GET", "items", options, function(data) {
		var items = data.items;
		// FIXME
		var feeds = {};
		for (var i = 0; i < data.feeds.length; i++) {
			var feed = data.feeds[i];
			feeds[feed.id] = feed;
		}

		callback(items.map(_this.normalize_article, feeds));
	});
}

OwnCloud.prototype.setArticleRead = function(article_id) {
	var options = {
		article_ids: article_id,
		mode: 0,
		field: 2
	};

	if (navigator.onLine) {
		this.doOperation("updateArticle", options);
	} else {
		var read_articles = localStorage.read_articles;
		if(typeof read_articles !== "undefined") read_articles = JSON.parse(read_articles);
		else read_articles = [];
		read_articles.push(article_id);
		localStorage.read_articles = JSON.stringify(read_articles);
	}
};

OwnCloud.prototype.setArticleStarred = function(article_id) {
	var options = {
		article_ids: article_id,
		mode: 1,
		field: 0
	};

	if (navigator.onLine) {
		this.doOperation("updateArticle", options);
	} 
};

OwnCloud.prototype.setArticleUnStarred = function(article_id) {
	var options = {
		article_ids: article_id,
		mode: 0,
		field: 0
	};

	if (navigator.onLine) {
		this.doOperation("updateArticle", options);
	} 
};

OwnCloud.prototype.setArticleUnread = function(article_id) {
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

OwnCloud.prototype.normalize_article = function(article) {
	var feeds = this;

	return {
		id: article.id,
		title: article.title,
		content: article.body,
		feed_title: feeds[article.feedId].title,
		excerpt: article.body.stripHTML().substring(0, 50),
		updated: article.pubDate,
		link: article.link,
		marked: article.starred,
		unread: article.unread
	}
};

OwnCloud.prototype.logOut = function() {
	this.doOperation("logout");
};

OwnCloud.login = function(server_url, user, password, callback) {
	
	var url = server_url + "/index.php/apps/news/api/v1-2/version";

	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		console.log(xhr.status)
		if(xhr.readyState == 4) {
			if(xhr.status == 200) {
				callback(JSON.parse(xhr.responseText))
			} else {
				alert("error: " + xhr.status + " " + xhr.statusText)
			}
		}
	}

	xhr.open("GET", url, true);
	xhr.withCredentials = true;
	var auth = btoa(user + ':' + password);
	xhr.setRequestHeader('Authorization', 'Basic ' + auth);
	xhr.send();
}
