var stdin = process.openStdin();
var events = require('events');
var util = require('util');
var clc = require('cli-color');
var input = require('../lib/input.js');

var colors = [
		{'from':clc.magentaBright, 'to':clc.magenta },
		{'from':clc.cyanBright,'to':clc.cyan },
		{'from':clc.yellowBright, 'to':clc.yellow },
		{'from':clc.redBright, 'to':clc.red },
		{'from':clc.greenBright, 'to':clc.green },
		{'from':clc.whiteBright.bgMagenta, 'to':clc.white.bgMagenta },
		{'from':clc.whiteBright.bgCyan,'to':clc.white.bgCyan },
		{'from':clc.whiteBright.bgYellow, 'to':clc.white.bgYellow },
		{'from':clc.whiteBright.bgRed,'to':clc.white.bgRed },
		{'from':clc.whiteBright.bgGreen, 'to':clc.white.bgGreen },
	];

var autocompleteCommands = [
	'roster',
	'friends',
	'set status',
	'set status away',
	'set status dnd',
	'set status online'
];

var View = function() {

	var emitter = new events.EventEmitter();
	this.on = function() {
		emitter.on.apply(emitter, arguments);
	}
	this.lastNotification = 0;
	var self = this;

	this.setModel = function(model){
		this.model = model;
		this.model.on('invalidate', function(type, extra){
			switch(type) {
				case 'roster':
					if (extra) {
						input.safePrint(self.printStatus, self, [extra, true]);
					} else {
						input.safePrint(self.printRoster, self);
					}
					break;

				case 'chat':
					input.safePrint(self.printChat, self);
					break;
			}
		});
	}

	this.initInput = function() {
		input.init(this.handleInput, this.autoComplete);
	}

	this.printRoster = function() {
		for (var i=0; i<this.model.roster.length; i++) {
			var r = this.model.roster[i];
			if (r.status != 'offline')
				this.printStatus(r, false);
		}
	}
	this.printStatus = function(obj, timestamp) {
		var t = timestamp ? this.formatTimestamp() : ' ';
		var c = self.getRosterColor(obj.jid, 'from');
		var show = obj.statusText !== '' ? ' "' + obj.statusText + '"' : '';
		console.log(t + self.getStatusLabel(obj.status, '\u25CF ') + obj.displayName() + ' ' + c(obj.jid) +  ' is ' + obj.status + show);

		if (!timestamp) {
			for (var i=0; i<obj.resources.length; i++) {
				var resource = obj.resources[i];
				console.log('    ' + self.getStatusLabel(obj.status, '\u25CF ') + resource.status + ' via ' + self.clientName(resource.capsNode));
			}
		}
	}
	this.clientName = function (cap) {
		if (cap === 'http://mail.google.com/xmpp/client/caps') {
			return 'gmail.com';
		} else if (cap === 'http://www.android.com/gtalk/client/caps') {
			return 'Android';
		} else {
			return cap;
		}
	}
	this.getStatusLabel = function (status, label) {
		var l = label || status;
		if (status==='online') {
			return clc.greenBright(l);
		} else if (status==='offline') {
			return clc.redBright(l);
		} else if (status==='dnd') {
			return clc.redBright(l);
		} else if (status==='away') {
			return clc.yellowBright(l);
		} else {
			return clc.blueBright(l);
		}
	}

	this.printChat = function() {
		for (var jid in this.model.chat) {
			for (var i = 0; i < this.model.chat[jid].length; i++) {
				this.printMessage(jid, this.model.chat[jid][i]);
			}
		}
	}

	this.formatTimestamp = function (date) {
		var d = date || new Date();
		var ts = function (n) { if (n < 10) { return '0'+n } else { return n.toString() }}
		return clc.blackBright('['+ts(d.getHours()) + ':' + ts(d.getMinutes())+'] ');
	}

	/**
	 * returns a color function 
	 * @param	jid	The JID
	 * @param	action	"from" or "to"
	 */
	this.getRosterColor = function(jid, action) {
		var index = 0;
		for (var i =0; i<this.model.roster.length; i++) {
			if (jid === this.model.roster[i].jid) {
				index = i;
			}
		}
		return colors[index % colors.length][action];
	}

	this.notifyIncomming = function () {
		var now = new Date().getTime();
		if (now - self.lastNotification > 1000) {
			self.lastNotification = now;
			process.stdout.write("\007");
		}

	}

	// jid@jid >>> Hello you :-)
	// jid@jid <<< Ok! her er en smiley mere ;) :( :p :-P
	this.printMessage = function(jid, msg) {
		if (msg.printed) return;
		
		var c = self.getRosterColor(jid, msg.action);
		var t = this.formatTimestamp(msg.time);
		var wrap = require('wordwrap')(process.stdout.columns);
		var contact = this.model.getOrCreateRoster(jid)[0];

		if (msg.action==='from') {
			console.log(wrap(t + c(contact.displayName()) + clc.blackBright(' >>> ') + this.formatSmileys(msg.text)));
			self.notifyIncomming();
		} else {
			console.log(wrap(t + c(contact.displayName()) + clc.blackBright(' <<< ') + this.formatSmileys(msg.text)));
		}
		msg.printed = true;
	}

	this.formatSmileys = function(text) {
		var pattern = /([\:\;][-]?[)pP|(])/gi,
			splitted = text.split(pattern),
			formatted = "";
		for (var i=0; i<splitted.length; i++) {
			var subject = splitted[i],
				isSmiley = subject.match(pattern);
			formatted += isSmiley ?  clc.black.bgYellowBright(subject) : subject;
		}
		return formatted;
	}

	this.autoComplete = function(inputLine) {
		if (self.model.roster) {
			for (var i=0; i<self.model.roster.length; i++) {
				if (self.model.roster[i].jid.indexOf(inputLine) === 0) {
					var s = self.model.roster[i].jid + ': ';
					// emitter.emit('composing', {'to': self.model.roster[i].jid}); //need better implementation
					return s;
				}
				if (self.model.roster[i].displayName().indexOf(inputLine) === 0) {
					return self.model.roster[i].jid + ': ';
				}
			}
		} 
		for (var j=0; j<autocompleteCommands.length; j++) {
			if (autocompleteCommands[j].indexOf(inputLine) === 0) {
				var c = autocompleteCommands[j] + ' ';
				return c;
			}
		}
		return "";
	};

	this.handleInput = function(line) {

		switch(line) {
			case 'roster':
			case 'friends':
				input.safePrint(self.printRoster, self);
				return {};
				break;
		}

		var regex = /^([\S@\S]+)\:\s(.+)$/i
		var result = line.match(regex);
		if (result && result.length > 2) {
			var jid = result[1];
			var msg = result[2];
			emitter.emit('input', {jid:jid, msg:msg});
		}

		if (line.indexOf('set status') === 0) {
			var args = line.substring(11);
			var status = args.split(' ')[0];
			var text = args.substring(status.length + 1);
			emitter.emit('status', {status:status, text:text});
		}

		return {jid:jid, msg:msg, line:line};
	}
	

}

module.exports = new View();