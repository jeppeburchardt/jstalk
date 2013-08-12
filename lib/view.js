var stdin = process.openStdin();
var events = require('events');
var util = require('util');
var clc = require('cli-color');

var colors = [
		{'from':clc.magentaBright, 'to':clc.magenta },
		{'from':clc.cyanBright,'to':clc.cyan },
		{'from':clc.yellowBright, 'to':clc.yellow },
		{'from':clc.blueBright, 'to':clc.blue },
		{'from':clc.redBright, 'to':clc.red },
		{'from':clc.greenBright, 'to':clc.green },
		{'from':clc.whiteBright.bgMagenta, 'to':clc.white.bgMagenta },
		{'from':clc.whiteBright.bgCyan,'to':clc.white.bgCyan },
		{'from':clc.whiteBright.bgYellow, 'to':clc.white.bgYellow },
		{'from':clc.whiteBright.bgBlue, 'to':clc.white.bgBlue },
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
	var self = this;

	this.line = "";

	this.setModel = function(model){
		this.model = model;
		this.model.on('invalidate', function(type, extra){
			switch(type) {
				case 'roster':
					if (extra) {
						self.safePrint(self.printStatus, [extra, true]);
					} else {
						self.safePrint(self.printRoster);
					}
					break;

				case 'chat':
					self.printChat();
					break;
			}
		});
	}

	this.safePrint = function(method, extra){
		process.stdout.write('\u001B[0E'); // move cursor to start of line
		process.stdout.write('\u001B[0J'); // clear line
		method.apply(this, extra);
		self.shortenInput();
	}

	this.printRoster = function() {
		for (var i=0; i<this.model.roster.length; i++) {
			var r = this.model.roster[i];
			this.printStatus(r, false);
		}
	}
	this.printStatus = function(obj, timestamp) {
		var t = timestamp ? this.formatTimestamp() : '';
		if (obj.status==='online') {
			console.log(t + obj.jid + ' is ' + clc.black.bgGreen('online'));
		} else if (obj.status==='offline') {
			console.log(t + obj.jid + ' is ' + clc.black.bgRed('offline'));
		} else if (obj.status==='away') {
			console.log(t + obj.jid + ' is ' + clc.black.bgYellow('away'));
		} else {
			console.log(t + obj.jid + ' is ' + clc.black.bgBlue(obj.status));
		}
	}

	this.printChat = function() {
		var safe = this.line;
		// clear input:
		process.stdout.write('\u001B[0E'); // move cursor to start of line
		process.stdout.write('\u001B[0J'); // clear line

		for (var jid in this.model.chat) {
			for (var i = 0; i < this.model.chat[jid].length; i++) {
				this.printMessage(jid, this.model.chat[jid][i]);
			}
		}

		this.shortenInput();
	}

	this.formatTimestamp = function (date) {
		var d = date || new Date();
		var ts = function (n) { if (n < 10) { return '0'+n } else { return n.toString() }}
		return clc.blackBright('['+ts(d.getHours()) + ':' + ts(d.getMinutes())+'] ');
	}

	// jid@jid >>> Hello you :-)
	// jid@jid <<< Ok! her er en smiley mere ;) :( :p :-P
	this.printMessage = function(jid, msg) {
		if (msg.printed) return;
		var index = 0;
		for (var i =0; i<this.model.roster.length; i++) {
			if (jid === this.model.roster[i].jid) {
				index = i;
			}
		}
		var c = colors[index % colors.length][msg.action];
		var t = this.formatTimestamp(msg.time);
		

		// smileys:
		// msg = msg.text.replace(/([\:\;][-]?[)pP|(])/, function(smiley){
		// 	return clc.black.bgYellow(smiley);
		// });

		

		if (msg.action==='from') {
			console.log(t + jid + ' >>> ' + this.formatSmileys(msg.text, c));
			process.stdout.write("\007");
		} else {
			console.log(t + jid + ' <<< ' + this.formatSmileys(msg.text, c));
		}
		msg.printed = true;
	}

	this.formatSmileys = function(text, color) {
		var pattern = /([\:\;][-]?[)pP|(])/gi,
			splitted = text.split(pattern),
			formatted = "";
		for (var i=0; i<splitted.length; i++) {
			var subject = splitted[i],
				isSmiley = subject.match(pattern);
			formatted += isSmiley ?  clc.black.bgYellowBright(subject) : color(subject);
		}
		return formatted;
	}

	this.handleInput = function(line) {

		switch(line) {
			case 'roster':
			case 'friends':
				this.safePrint(this.printRoster);
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

	this.shortenInput = function () {
		var offset = self.line.length - process.stdout.columns + 2;
		process.stdout.write('\u001B[0E'); // move cursor to start of line
		process.stdout.write('\u001B[0J'); // clear line
		process.stdout.write(self.line.substring(offset));
	}

	this.initInput = function() {
		process.stdin.resume();
		process.stdin.setEncoding('utf8');
		stdin.setRawMode(true);
		// read more: http://en.wikipedia.org/wiki/ANSI_escape_code

		process.stdin.on('data', function (char) {
			char = char + '';

			switch (char) {
				case "\n": 
				case "\r": 
				case "\u0004":
				case "\u000D":
				case "\u002B":
					var r = self.handleInput(self.line);
					if (r.jid) {
						self.line = r.jid + ': ';
					} else {
						self.line = '';
					}
					process.stdout.write('\u001B[0E'); // move cursor to start of line
					process.stdout.write('\u001B[0J'); // clear line
					process.stdout.write(self.line);
					break;

				case "\u0009":
					// tab
					if (self.model.roster) {
						for (var i=0; i<self.model.roster.length; i++) {
							if (self.model.roster[i].jid.indexOf(self.line) === 0) {
								var s = self.model.roster[i].jid.substring(self.line.length) + ': ';
								self.line += s;
								process.stdout.write(s);
								emitter.emit('composing', {'to': self.model.roster[i].jid});
								break;
							}
						}
					} 
					for (var j=0; j<autocompleteCommands.length; j++) {
						if (autocompleteCommands[j].indexOf(self.line) === 0) {
							var c = autocompleteCommands[j].substring(self.line.length) + ' ';
							self.line += c;
							process.stdout.write(c);
							break;
						}
					}
					break;

				case "\u0008":
					//backspace
					self.line = self.line.substring(0, self.line.length-1);
					self.shortenInput();
					break;

				case "\u0003":
					// Ctrl C
					process.exit();
					break

				case "\u001C":
					break;

				case "\u001B": //ESC
					self.line = "";
					process.stdout.write('\u001B[0E'); // move cursor to start of line
					process.stdout.write('\u001B[0J'); // clear line
					break;

				case "\u001b[D": //LEFT
				case "\u001b[A": //UP
				case "\u001b[C": //RIGHT
				case "\u001b[B": //DOWN
					break;

				default:
					self.line += char;
					if ((self.line.length+2) > process.stdout.columns) {
						self.shortenInput();
					} else {
						process.stdout.write(char);
					}
					break;
			}
		});
	}

}

module.exports = new View();