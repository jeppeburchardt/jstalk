
console.log('\u25CF');

// var stdin = process.openStdin();

// var clc = require('cli-color');

// process.stdin.resume();
// process.stdin.setEncoding('utf8');
// stdin.setRawMode(true);

// var line = "";

// process.stdin.on('data', function (char) {

// 	char = char + '';

// 	switch (char) {
// 		case "\n": 
// 		case "\r": 
// 		case "\u0004":
// 		case "\u000D":
// 		case "\u002B":
// 			process.stdout.write('\u001B[0E'); // move cursor to start of line
// 			process.stdout.write('\u001B[0J'); // clear line
// 			process.stdout.write(clc.magentaBright(line) + '\n\r');
// 			line = "";
// 			process.stdout.write('\u001B[0E'); // move cursor to start of line
// 			process.stdout.write('\u001B[0J'); // clear line
// 			process.stdout.write('>');
// 			break;

// 		case "\u0003":
// 			// Ctrl C
// 			process.exit();
// 			break

// 		default:
// 			line += char;
// 			if ((line.length+2) > process.stdout.columns) {
// 				var offset = line.length - process.stdout.columns + 5;
// 				process.stdout.write('\u001B[0E'); // move cursor to start of line
// 				process.stdout.write('\u001B[0J'); // clear line
// 				process.stdout.write('...' +line.substring(offset));
// 			} else {
// 				process.stdout.write(char);
// 			}
// 			break;
// 	};
// });