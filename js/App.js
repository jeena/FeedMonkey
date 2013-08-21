
function App() {
	this.login = new Login(this);
	this.currentIndex = -1;
	this.page = 2;
	var _this = this;
	$("#reload").on("vclick", function() {
		$(this).removeClass('ui-btn-active ui-focus');
		_this.reload();
	});

	$("#full").bind("swipeleft", this.showNext.bind(this));
	$("#full").bind("swiperight", this.showPrevious.bind(this));
	$("#full").bind("taphold", this.setCurrentUnread.bind(this));

	$(".back").on("vclick", this.setCurrentRead.bind(this));
	//$(".count").button();

	var _this = this;
	var aop = function(event, ui) { setTimeout(function() { $("#popup").popup("close") }, 2000) };
	$("#popup").popup({ afteropen: aop});
};

App.prototype.authenticate = function() {
	
};

App.prototype.toString = function() {
	return "App";
};

App.prototype.after_login = function() {
	$.mobile.changePage($("#list"));
	this.ttrss = new TinyTinyRSS(this, localStorage.server_url, localStorage.session_id);
	this.reload();
};

App.prototype.reload = function() {
	this.unread_articles = [];
	this.ttrss.getUnreadFeeds(this.gotUnreadFeeds.bind(this));
};

App.prototype.gotUnreadFeeds = function(new_articles) {
	if(new_articles == null) { // on error load the saved unread articles.
		this.unread_articles = JSON.parse(localStorage.unread_articles);
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
	var ul = $("#list ul");
	var html_str = "";
	for (var i = 0; i < this.unread_articles.length; i++) {
		var article = this.unread_articles[i];
		html_str += "<li"+ (article.unread ? " class='unread'" : "") +"><a href='#full-"+i+"'><p class='ui-li-desc'><strong>" + article.feed_title + "</strong></p><h3 class='ui-li-heading'>" + article.title + "</h3><p class='ui-li-desc'>" + article.excerpt + "</p></a></li>";
	}

	ul.html(html_str);

	ul.listview("refresh");

	$(".count").html(this.unread_articles.length + " / " + this.unread_articles.length);
	//$(".count").button("refresh");
};

App.prototype.updateList = function() {
	var unread = 0;
	var _this = this;
	$("#list ul li").each(function(i, o) {
		if(!_this.unread_articles[i].unread) $(this).removeClass("unread");
		else {
			unread++;
			$(this).addClass("unread");
		}
	});

	//$("#list ul").listview("refresh");

	$(".count").html(unread + " / " + this.unread_articles.length);
	//$(".count").button("refresh");
};

App.prototype.showFull = function(article, slide_back) {

	this.currentIndex = this.unread_articles.indexOf(article);

	var page_id = "#full";

	$(page_id + " .date").html("");
	$(page_id + " .title").html("");
	$(page_id + " .title").attr("href", "");
	$(page_id + " .title").attr("title", "");
	$(page_id + " .feed_title").html("");
	$(page_id + " .author").html("");
	$(page_id + " .article").html("");

	$(page_id + " .date").html((new Date(parseInt(article.updated, 10) * 1000)).toLocaleString());
	$(page_id + " .title").html(article.title);
	$(page_id + " .title").prop("href", article.link);
	$(page_id + " .title").prop("title", article.link);
	$(page_id + " .feed_title").html(article.feed_title);
	if(article.author && article.author.length > 0)
		$(page_id + " .author").html("&ndash; " + article.author);
	$(page_id + " .article").html(article.content);

	$.mobile.changePage($(page_id), { transition: "slide", reverse: slide_back });
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
	if(!article.set_unread) {
		article.unread = false;
		this.updateList();
		var _this = this;
		setTimeout(function() { _this.ttrss.setArticleRead(article.id); },100);
	}

	article.set_unread = false;
};

App.prototype.setCurrentUnread = function() {
	var article = this.unread_articles[this.currentIndex];
	article.unread = true;
	article.set_unread = true;
	this.updateList();
	$("#popup").popup("open");
	var _this = this;
	setTimeout(function() { _this.ttrss.setArticleUnread(article.id); }, 100);
};

App.prototype.goToList = function() {
	$.mobile.changePage("#list", {transition: "slide", reverse: true});
};