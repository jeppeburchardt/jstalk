var events = require('events');

function parseJid(jid) {
	var regex = /^([^@]+@[^\/]+)\/?(.*)?$/i
	var result = jid.match(regex);
	if (result && result.length > 1) {
		return {
			'jid':result[1],
			'resource':result[2]
		}
	}
	return null;
}

var Model = function() {

	this.chat = {};
	this.roster = [];

	var emitter = new events.EventEmitter();
	this.on = function() {
		emitter.on.apply(emitter, arguments);
	}
	var self = this;


	this.invalidate = function(type, extra) {
		emitter.emit('invalidate', type, extra)
	}

	this.addChatEntry = function(from, action, text) {
		var jid = parseJid(from).jid;
		if (!this.chat[jid]) {
			this.chat[jid] = new Array(); 
		}
		this.chat[jid].push({
			time: new Date(),
			action: action,
			text: text
		});
		this.invalidate('chat');
		emitter.emit('chat');
	}

	this.getOrCreateRoster = function(jid_p) {
		var jid = parseJid(jid_p);
		if (jid) {
			var item = null;
			for (var i = 0; i < this.roster.length; i++) {
				item = this.roster[i];
				if (item.jid === jid.jid) {
					break;
				}
				item = null;
			}
			if (item === null) {
				item = {
					'jid':jid.jid,
					'status':'offline',
					'statusText':'',
					'resources':[],
					'chatState':'inactive'
				};
				this.roster.push(item);
			}
			

			var res = null;
			if (jid.resource) {
				for (var j=0; j < item.resources.length; j++) {
					res = item.resources[j];
					if (res.resource === jid.resource) {
						break;
					}
					res = null;
				}

				if (res === null) {
					res = {
						'resource': jid.resource,
						'status': 'offline',
						'capsNode': 'unknown node',
						'capsVersion': '',
						'capsExt': '',
						'priority': 0
					}
					item.resources.push(res);
				}
			}

			
			return [item, res];
		}
	}

	this.setChatState = function (jid, state) {
		var result = this.getOrCreateRoster(jid);
		result[0].chatState = state;
		emitter.emit('chatState', result[0]);
	}

	this.changeStatus = function (jid, status, statusText, priority, capsNode, capsVersion, capsExt) {
		var result = this.getOrCreateRoster(jid);
		result[0].statusText = statusText;
		if (result[1]) {
			result[1].status = status;
		}

		var highestStatus = '';
		var onlineResouorces = result[0].resources.filter(function(r){return r.status==='online'});
		var offlineResources = result[0].resources.filter(function(r){return r.status==='offline'});
		var otherResources = result[0].resources.filter(function(r){return r.status!='online' && r.status!='offline'});
		if (onlineResouorces.length > 0) {
			highestStatus = 'online';
		} else if (result[0].resources.length === offlineResources.length) {
			highestStatus = 'offline';
		} else {
			highestStatus = result[0].resources[0].status;
		}
		var change = result[0].status != highestStatus;
		result[0].status = highestStatus;

		if (result[1]) {
			if (capsNode) { result[1].capsNode = capsNode };
			if (capsVersion) { result[1].capsVersion = capsVersion };
			if (capsExt) { result[1].capsExt = capsExt };
		}

		if (change) {
			this.invalidate('roster', result[0]);
			emitter.emit('status', result[0]);
		}
	}
}

module.exports = new Model();

