var events = require('events');

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

	this.changeStatus = function (jid, status) {
		for (var i = 0; i < this.roster.length; i++) {
			var r = this.roster[i];
			if (r.jid === jid) {
				r.status = status;
				this.invalidate('roster', r);
			}
		}
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

