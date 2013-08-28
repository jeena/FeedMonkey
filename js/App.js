
function App() {
	this.login = new Login(this);
	this.currentIndex = -1;

	var color = localStorage.color;
	if(!color) color = "red";
	this.setColor(color);

};

App.prototype.authenticate = function() {
	
};

App.prototype.after_login = function() {

	var request = window.navigator.mozApps.getSelf();
	request.onsuccess = function() {
		$("#version").innerHTML = request.result.manifest.version;
	}

	var _this = this;

	window.onhashchange = function(e) {

		// do not reload page
		e.preventDefault();
 		e.stopPropagation();

		var url = window.location.hash;

		if(url == "#list") {
			_this.setCurrentRead();
			_this.changeToPage("#list");
		} else if(url == "#reload") {
			_this.reload();
		} else if(url == "#settings") {
			_this.changeToPage("#settings");
		} else if(url.indexOf("#color-") == 0) {
			var color = url.replace("#color-", "");
			_this.setColor(color);
		} else if(url.indexOf("#full-") == 0) {
			var i = parseInt(url.replace("#full-", ""), 10);
			_this.showFull(_this.unread_articles[i]);
		} else if(url == "#unread") {
			_this.setCurrentUnread();
		} else if(url == "#logout") {
			_this.logout();
		} else if(url == "#reset-info") {
			alert("Info bubbles will be shown again.")
			$$(".info").forEach(function(o) {
				o.removeClass("hidden");
			});
		} else if(url == "#next") {
			_this.showNext();
		} else if(url == "#previous") {
			_this.showPrevious();
		}

		// this is here so you can tap on a button more then once
		// and it will still call onhashchange
		window.location.hash = "#";
	}

	// FIXME move that code somewhere else
	$(".info.swipe").ontouchend = function(e) {
		localStorage.info_swipe = true;
		$(".info.swipe").addClass("hidden");
	};

	var supportsTouch = 'ontouchend' in document;

	if(!supportsTouch || localStorage.info_swipe) {
		$(".info.swipe").addClass("hidden");
	}

	// set up swiping
	jester($("#full")).flick(function(touches, direction) {
		if(direction == "left") _this.showNext();
		else _this.showPrevious();
	});


	this.changeToPage("#list");

	this.ttrss = new TinyTinyRSS(this, localStorage.server_url, localStorage.session_id);
	this.reload();
};

App.prototype.logout = function() {
	this.ttrss.logOut();
	this.unread_articles = [];
	this.populateList();
	this.login.log_out();
};

App.prototype.changeToPage = function(page) {

	// FIXME
	var active = $(".active");
	if(active.id == "list") {
		this.saveScrollTop = document.body.scrollTop;
	}

	if(page == "#list") {
		document.body.scrollTop = this.saveScrollTop;
	} else {
		window.scroll(0,0);
	}

	active.removeClass("active");
	$(page).addClass("active");
};

App.prototype.setColor = function(color) {
	localStorage.color = color;
	document.body.className = "";
	document.body.addClass(color);
	this.updatePieChart();
};

App.prototype.reload = function() {
	this.unread_articles = [];
	this.ttrss.getUnreadFeeds(this.gotUnreadFeeds.bind(this));
};

App.prototype.gotUnreadFeeds = function(new_articles) {

	if(new_articles == null) { // on error load the saved unread articles.
		
		var old_articles = localStorage.unread_articles;
		if(old_articles) {
			this.unread_articles = JSON.parse(old_articles);	
		}
		this.populateList();

	} else {

		this.unread_articles = this.unread_articles.concat(new_articles);

		if(new_articles.length > 0) {
			this.ttrss.getUnreadFeeds(this.gotUnreadFeeds.bind(this), this.unread_articles.length);
		} else {
			localStorage.unread_articles = JSON.stringify(this.unread_articles);
			this.populateList();
		}		
	}
};

App.prototype.populateList = function() {

	var html_str = "";
	for (var i = 0; i < this.unread_articles.length; i++) {
		var article = this.unread_articles[i];
		html_str += "<li"+ (article.unread ? " class='unread'" : "") +">";
		html_str += "<a href='#full-"+i+"'>";
		html_str += "<p class='title'>";
		html_str += "<strong>" + article.feed_title + "</strong>";
		html_str += "</p>";
		html_str += "<h2>" + article.title + "</h2>";
		if(article.excerpt)	html_str += "<p class='excerpt'>" + article.excerpt + "</p>";
		html_str += "</a></li>";
	}
	
	$("#list ul").innerHTML = html_str;

	this.updatePieChart();
};

App.prototype.updateList = function() {
	var unread = 0;
	var _this = this;
	$$("#list ul li").forEach(function(o, i) {
		if(!this.unread_articles[i].unread) o.removeClass("unread");
		else {
			unread++;
			o.addClass("unread");
		}
	}, this);

	this.updatePieChart();
};

App.prototype.updatePieChart = function(all, unread) {

	var all = this.unread_articles.length;
	var unread = 0;
	for (var i = 0; i < all; i++) {
		if(this.unread_articles[i].unread) unread++;
	};


	var a = 100 / all * unread;
	var b = 100 / all * (all - unread);

	var bg = window.getComputedStyle($("body"), null).backgroundColor;
	var fg = window.getComputedStyle($(".bar"), null).backgroundColor;

	var myColor = [bg, fg];

	var data = [a, b];

	$$("canvas").forEach(function(canvas) {
		var ctx = canvas.getContext("2d");
		var lastend = 0;
		var myTotal = 0;

		for(var e = 0; e < data.length; e++) myTotal += data[e];

		for (var i = 0; i < data.length; i++) {
			ctx.fillStyle = myColor[i];
			ctx.beginPath();
			ctx.moveTo(canvas.width/2, canvas.height/2);
			ctx.arc(canvas.width/2, canvas.height/2, canvas.height/2, lastend, lastend+(Math.PI*2*(data[i]/myTotal)), false);
			ctx.lineTo(canvas.width/2, canvas.height/2);
			ctx.fill();
			lastend += Math.PI*2*(data[i]/myTotal);
		}
	})
};

App.prototype.showFull = function(article, slide_back) {

	this.changeToPage("#full");

	this.currentIndex = this.unread_articles.indexOf(article);

	var page_id = "#full";

	$(page_id + " .date").innerHTML = (new Date(parseInt(article.updated, 10) * 1000)).toLocaleString();

	var title = $(page_id + " .title");
	title.innerHTML = article.title;
	title.href = article.link;

	$(page_id + " .feed_title").innerHTML = article.feed_title;

	$(page_id + " .author").innerHTML = "";
	if(article.author && article.author.length > 0)
		$(page_id + " .author").innerHTML = "&ndash; " + article.author; 

	$(page_id + " .article").innerHTML = article.content;

	if(article.set_unread) {
		$("#setunread").innerHTML = "✔ unread";
	} else {
		$("#setunread").innerHTML = "Set unread";
	}

};

App.prototype.showNext = function() {
	this.setCurrentRead();

	if(this.currentIndex >= this.unread_articles.length - 1) {
		this.goToList();
	} else {
		this.currentIndex++;
		this.showFull(this.unread_articles[this.currentIndex], false);
	}
};

App.prototype.showPrevious = function() {
	this.setCurrentRead();

	if(this.currentIndex <= 0) {
		this.goToList();
	} else {
		this.currentIndex--;
		this.showFull(this.unread_articles[this.currentIndex], true);
	}
};

App.prototype.setCurrentRead = function() {
	var article = this.unread_articles[this.currentIndex];
	if(!article) return; // happens if we're not on a full article site
	
	if(!article.set_unread) {
		article.unread = false;
		this.updateList();
		var _this = this;
		setTimeout(function() { _this.ttrss.setArticleRead(article.id); }, 100);
	}

	article.set_unread = false;

	this.updatePieChart();
};

App.prototype.setCurrentUnread = function() {
	var article = this.unread_articles[this.currentIndex];
	article.unread = true;
	article.set_unread = true;
	this.updateList();
	var _this = this;
	setTimeout(function() { _this.ttrss.setArticleUnread(article.id); }, 100);

	$("#setunread").innerHTML = "✔ unread";
};

App.prototype.goToList = function() {
	this.changeToPage("#list");
};
