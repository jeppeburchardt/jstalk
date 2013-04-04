
var stdin = process.openStdin();

var roster = null;

var events = require('events');
var util = require('util');

var emitter = new events.EventEmitter();

function InputHandler() {

	var emitter = new require('events').EventEmitter();
	this.on = function() {
		emitter.on.apply(events, arguments);
	}

	this.setModel = function(m) {
		roster = m.roster;
	}


}


var setModel = function(m) {
	roster = m.roster;
}

var init = function(callback) {
	process.stdin.resume();
	process.stdin.setEncoding('utf8');
	stdin.setRawMode(true);
	
	var line = "";

	process.stdin.on('data', function (char) {
	char = char + '';

	switch (char) {
		case "\n": case "\r": case "\u0004":
			// read more: http://en.wikipedia.org/wiki/ANSI_escape_code
			process.stdout.write('\u001B[0E'); // move cursor to start of line
			process.stdout.write('\u001B[0J'); // clear line
			callback(line);
			line = "";
			break

		case "\u0009":
			// tab
			if (roster) {
				for (var i=0; i<roster.length; i++) {
					if (roster[i].jid.indexOf(line) === 0) {
						var s = roster[i].jid.substring(line.length) + ' <<< ';
						line += s;
						process.stdout.write(s);
					}
				}
			}
			break;

		case "\u0008":
			//backspace
			line = line.substring(0, line.length-1);
			process.stdout.write(char);
			process.stdout.write('\u001B[0J');
			break;

		case "\u0003":
			// Ctrl C
			console.log('Cancelled');
			process.exit();
			break

		default:
			// More passsword characters
			process.stdout.write(char);
			line += char;
			break
		}
	});
}


exports.setModel = setModel;
exports.init = init;