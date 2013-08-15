var events = require('events');

function parseJid(jid) {
	var regex = /^([\S@\S]+)\/(.+)$/i
	var result = jid.match(regex);
	if (result && result.length > 2) {
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
		if (!this.chat[from]) {
			this.chat[from] = new Array(); 
		}
		this.chat[from].push({
			time: new Date(),
			action: action,
			text: text
		});
		this.invalidate('chat');
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
				item = {'jid':jid.jid, 'status':'offline', 'resources':[]};
				this.roster.push(item);
			}
			

			var res = null;
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
				console.log('adding new resource ('+jid.resource+') to ' + item.jid);
			}

			
			return [item, res];
		}
	}

	this.changeStatus = function (jid, status, statusText, priority, capsNode, capsVersion, capsExt) {
		var result = this.getOrCreateRoster(jid);
		result[0].status = status; //hmmmm... read up on status and resource priority
		result[1].status = status;
		result[1].capsNode = capsNode;
		result[1].capsVersion = capsVersion;
		result[1].capsExt = capsExt;
		this.invalidate('roster', result[0]);
	}

	this.dummyData = function() {
		this.roster.push({jid:'person1@gmail.com', status:'online'});
		this.roster.push({jid:'person2@gmail.com', status:'away'});
		this.roster.push({jid:'person3@some-domain.com', status:'offline'});

		this.chat['person3@some-domain.com'] = [
				{time:new Date(), action:'to', text:'Hello'},
				{time:new Date(), action:'from', text:'Hey you. Lorem ipsum dolor sit amet. Jeppe ved ikke hvad han skal skrive, dette er jo kun en test. Dunny data er dumt sagde anders\' hest'}
			];
		this.chat['person2@gmail.com'] = [
			{time:new Date(), action:'to', text:'Hej med dig'},
			{time:new Date(), action:'from', text:'Kan du læse danske bogstaver? æøå ÆØÅ'}
		];

		this.invalidate('roster');
		this.invalidate('chat');
	}
}

module.exports = new Model();

