var events = require('events');
var xmpp = require('./xmpp/client.js');

var Controller = function() {

	// var emitter = new events.EventEmitter();
	// this.on = function() {
	// 	emitter.on.apply(emitter, arguments);
	// }
	// var self = this;

	// this.model = null;

	// xmpp.on('online', function() {
	//     console.log('Yes, I\'m connected!');
	// });

	// xmpp.on('chat', function(from, message) {
	//     xmpp.send(from, 'echo: ' + message);
	// });

	// xmpp.on('error', function(err) {
	//     console.error(err);
	// });

	// xmpp.on('subscribe', function(from) {
	// 	if (from === 'a.friend@gmail.com') {
	// 	    xmpp.acceptSubscription(from);
	//     }
	// });

	// this.setModel = function(model){
	// 	this.model = model;
	// }

	this.connect = function(jid, password, host, port) {

		xmpp.connect(jid, password, host, port); 

		// xmpp.connect({
		//     jid         : jid,
		//     password    : password,
		//     host        : host,
		//     port        : port
		// });

		
	}

}


module.exports = new Controller();