var events = require('events');
var xmpp = require('simple-xmpp');

var Controller = function() {

	var emitter = new events.EventEmitter();
	this.on = function() {
		emitter.on.apply(emitter, arguments);
	}
	var self = this;


	// this.model = null;

	xmpp.on('online', function() {
	    console.log('Connected!');
	});

	xmpp.on('chat', function(from, message) {
		self.model.addChatEntry(from, 'from', message);
	});

	xmpp.on('buddy', function(jid, state, statusText) {
	    // console.log('%s is in %s state - %s', jid, state, statusText);
	    self.model.changeStatus(jid, state, statusText);
	});

	xmpp.on('error', function(err) {
	    console.error(err);
	});

	xmpp.on('subscribe', function(from) {
		console.log('subscription from: ' + from);
	// 	if (from === 'a.friend@gmail.com') {
		    // xmpp.acceptSubscription(from);
	//     }
	});

	xmpp.on('close', function() {
	    console.error('connection has been closed!');
	});

	xmpp.on('stanza', function(stanza) {
        // console.log(stanza);
    });

	this.setModel = function(model){
		console.log("setting model");
		this.model = model;
	}

	this.send = function (jid, text) {
		xmpp.send(jid, text);
	}

	this.setStatus = function (status, text) {
		/**
	    @param show - Your current presence state ['away', 'dnd', 'xa', 'chat']
	    @param status - (optional) free text as your status message
		*/
		xmpp.setPresence(status, text);
	}

	this.setChatState = function (to, state) {
		xmpp.setChatstate(to, state);
	}

	this.connect = function(jid, password, host, port) {

		// xmpp.connect(jid, password, host, port); 

		console.log('logging in to %s', host);

		xmpp.connect({
		    jid         : jid,
		    password    : password,
		    host        : host,
		    port        : port
		});

		
	}

	xmpp.getRoster();
	xmpp.subscribe('beardedbuddha@gmail.com');

}


module.exports = new Controller();