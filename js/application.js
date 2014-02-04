function debug(obj) {
	if(typeof obj != "string")
		obj = JSON.stringify(obj);
	else {
		obj = arguments.join(' ')
	}
	
	alert(obj)
}

function $(obj) {
	if(typeof obj == "string") return document.querySelector(obj);
	else return obj;
}

function $$(obj) {
	if(typeof obj == "string") return document.querySelectorAll(obj);
	else return new NodeList(obj);
}

Object.getOwnPropertyNames(Array.prototype).forEach(function(methodName) {
    NodeList.prototype[methodName] = Array.prototype[methodName];
});

Node.prototype.hasClass = function(cls) {
	return this.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
};

Node.prototype.addClass = function(cls) {
	if (!this.hasClass(cls)) this.className += " " + cls;
};

Node.prototype.removeClass = function(cls) {
	if (this.hasClass(cls)) {
		var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
		this.className = this.className.replace(reg,' ');
	}
};

var __entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;"
};

String.prototype.escapeHTML = function() {
    return String(this).replace(/[&<>]/g, function (s) {
        return __entityMap[s];
    });
}

String.prototype.stripHTML = function() {
	return this.replace(/(<([^>]+)>)/ig, "");
}

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

if(!window.app) window.app = new App();

