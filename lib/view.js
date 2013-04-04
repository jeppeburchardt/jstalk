var stdin = process.openStdin();
var events = require('events');
var util = require('util');
var clc = require('cli-color');

var colors = [
		clc.red, 
		clc.green, 
		clc.yellow, 
		clc.blue, 
		clc.magenta, 
		clc.cyan,
		clc.white.bgRed,
		clc.white.bgGreen, 
		clc.white.bgYellow, 
		clc.white.bgBlue, 
		clc.white.bgMagenta, 
		clc.white.bgCyan,
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
						self.safePrint(self.printStatus, [extra]);
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

	this.safePrint = function(method, args){
		process.stdout.write('\u001B[0E'); // move cursor to start of line
		process.stdout.write('\u001B[0J'); // clear line
		method.apply(this, args);
		process.stdout.write(self.line);
	}

	this.printRoster = function() {
		for (var i=0; i<this.model.roster.length; i++) {
			var r = this.model.roster[i];
			this.printStatus(r);
		}
	}
	this.printStatus = function(obj) {
		if (obj.status==='online') {
			console.log(clc.black.bgGreen(obj.jid + ' is online'));
		} else if (obj.status==='offline') {
			console.log(clc.black.bgRed(obj.jid + ' is offline'));
		} else if (obj.status==='away') {
			console.log(clc.black.bgYellow(obj.jid + ' is away'));
		} else {
			console.log(clc.black.bgBlue(obj.jid + ' is ' + r.status));
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

		process.stdout.write(safe);
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
		var ts = function (n) { if (n < 10) { return '0'+n } else { return n.toString() }}
		var c = colors[index % colors.length];
		// var t = ts(msg.time.getHours()) + ':' + ts(msg.time.getMinutes()) + ' ';
		if (msg.action==='from') {
			console.log(jid + ' >>> ' + c(msg.text));
		} else {
			console.log(jid + ' <<< ' + msg.text);
		}
		msg.printed = true;
		// smileys:
		// .replace(/([\:\;][-]?[)pP|(])/, function(smiley){
		// 		return clc.black.bgYellow(smiley);
		// 	})
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
		return {jid:jid, msg:msg};
	}

	this.initInput = function() {
		process.stdin.resume();
		process.stdin.setEncoding('utf8');
		stdin.setRawMode(true);

		process.stdin.on('data', function (char) {
			char = char + '';

			switch (char) {
				case "\n": 
				case "\r": 
				case "\u0004":
					var r = self.handleInput(self.line);
					if (r.jid) {
						self.line = r.jid + ': ';
					} else {
						self.line = '';
					}
					// read more: http://en.wikipedia.org/wiki/ANSI_escape_code
					process.stdout.write('\u001B[0E'); // move cursor to start of line
					process.stdout.write('\u001B[0J'); // clear line
					process.stdout.write(self.line);
					break

				case "\u0009":
					// tab
					if (self.model.roster) {
						for (var i=0; i<self.model.roster.length; i++) {
							if (self.model.roster[i].jid.indexOf(self.line) === 0) {
								var s = self.model.roster[i].jid.substring(self.line.length) + ': ';
								self.line += s;
								process.stdout.write(s);
							}
						}
					}
					break;

				case "\u0008":
					//backspace
					self.line = self.line.substring(0, self.line.length-1);
					process.stdout.write(char);
					process.stdout.write('\u001B[0J'); //clear line from cursor
					break;

				case "\u0003":
					// Ctrl C
					process.exit();
					break

				case "\u0038":
				case "\u001C":
					break;

				default:
					process.stdout.write(char);
					self.line += char;
					break
			}
		});
	}

}

module.exports = new View();