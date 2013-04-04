var argv = require('optimist')
    .usage('Usage: $0 -u [str] email -s [str] server -p port [num]')
    .demand(['u'])
    .default({s:'talk.google.com', p:5223})
    .argv;

var passInput = require('../lib/password.js');
var model = require('../lib/model.js');
var view = require('../lib/view.js');
var controller = require('../lib/controller.js');

var user = argv.u,
	pass = 0,
	host = argv.s,
	port = argv.p;

var ti = 0;

passInput.getPassword('Password: ', function(input){
	pass = input;
	console.log('logging in to %s', host);

	controller.connect(user, pass, host, port);

	view.setModel(model);
	view.initInput();

	view.on('input', function (data) {
		// console.log('to xmpp: ' + data.msg);
		model.addChatEntry(data.jid, 'to', data.msg);
	});

	// model.dummyData();

	// setInterval(function() {
	// 	model.addChatEntry('person3@some-domain.com', 'from', (++ti) + 'Hey hvad så? Lorem ipsum dolor sit :) amet');
	// }, 10000);

	// setTimeout(function(){
	// 	model.changeStatus('person1@gmail.com', 'online');
	// }, 5000);

})


