var stdin = process.openStdin();
var util = require('util');

var Input = function() {

	this.line = "";
	this.autocompleteCommands = [];
	var self = this;

	/**
	 * removes current input line, calls a method and reprints the current input line
	 */
	this.safePrint = function(method, scope, extra){
		process.stdout.write('\u001B[0E'); // move cursor to start of line
		process.stdout.write('\u001B[0J'); // clear line
		method.apply(scope, extra);
		self.renderInput();
	};

	/**
	 * makes sure the current input line is rendered as a single line
	 */
	this.renderInput = function () {
		var offset = self.line.length - process.stdout.columns + 2;
		process.stdout.write('\u001B[0E'); // move cursor to start of line
		process.stdout.write('\u001B[0J'); // clear line
		process.stdout.write(self.line.substring(offset));
	};

	/**
	 * hijacks the stdin input
	 */
	this.init = function(handleInput, autoComplete) {
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
					var r = handleInput(self.line);
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
					var command = autoComplete(self.line);
					if (command != "") {
						self.line = command;
						self.renderInput();
					}
					break;

				case "\u0008":
				case "\u007F":
					//backspace
					self.line = self.line.substring(0, self.line.length-1);
					self.renderInput();
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
						self.renderInput();
					} else {
						process.stdout.write(char);
					}
					break;
			}
		});
	}

};


module.exports = new Input();