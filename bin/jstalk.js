var argv = require('optimist')
    .usage('Usage: $0 -u [str] email -s [str] server -p port [num]')
    .demand(['u'])
    .default({s:'talk.google.com', p:5222})
    .argv;

var passInput = require('../lib/password.js');
var model = require('../lib/model.js');
var view = require('../lib/view.js');
var controller = require('../lib/controller2.js');

var user = argv.u,
	pass = 0,
	host = argv.s,
	port = argv.p;

var ti = 0;

passInput.getPassword('Password: ', function(input){
	pass = input;
	
	controller.setModel(model);
	 controller.connect('test.jeppe.burchardt@gmail.com', 'jeppetester', host, port);
	// controller.connect(user, pass, host, port);

	view.setModel(model);
	view.initInput();

	view.on('input', function (data) {
		model.addChatEntry(data.jid, 'to', data.msg);
		controller.send(data.jid, data.msg);
	});

	view.on('status', function (data) {
		controller.setStatus(data.status, data.text);
	});

	view.on('composing', function (data) {
		controller.setChatState(data.to, 'composing');
	});

});


