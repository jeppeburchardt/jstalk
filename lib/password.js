var stdin = process.openStdin();

var getPassword = function(pretext, callback) {
	process.stdin.resume();
	process.stdin.setEncoding('utf8');
	stdin.setRawMode(true);
	password = ''
	process.stdout.write(pretext);
	process.stdin.on('data', function (char) {
	char = char + '';

	switch (char) {
		case "\n": case "\r": case "\u0004":
			process.stdout.write('\n')
			stdin.setRawMode(false);
			process.stdin.removeAllListeners('data', this);
			callback(password);
			break

		case "\u0003":
			// Ctrl C
			console.log('Cancelled');
			process.exit();
			break

		default:
			// More passsword characters
			process.stdout.write('*');
			password += char;
			break
		}
	});
}



exports.getPassword = getPassword;