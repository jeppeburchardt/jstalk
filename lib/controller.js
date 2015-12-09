var events = require('events');
var Client = require('node-xmpp-client');

// only for debugging purpose:
var clc = require('cli-color');

// stanza features:
var Messages = require('./features/messages.js').Messages;
var Presence = require('./features/presence.js').Presence;
var Roster = require('./features/roster.js').Roster;
var GmailNotify = require('./features/gmail_notify.js').GmailNotify;

var Controller2 = function() {

	var emitter = new events.EventEmitter();
	this.on = function() {
		emitter.on.apply(emitter, arguments);
	}
	var self = this;
	this.model = null;
	this.xmpp = null;
	this.jid = '';
	this.callbacks = {};
	this.handlers = [];


	this.sendSetIqWithCallback = function(xml, callback) {
		var id = 'ID' + new Date().getTime();
		xml.attrs.id = id;
		self.callbacks[id] = callback;
		self.xmpp.send(xml);
	}

	this.connect = function(jid, password, host, port) {

		self.jid = jid;

		self.xmpp = new Client({
			jid: jid,
			password: password,
			host: host,
			port: port,
			reconnect: true,
		});

		self.xmpp.on('online', self.onOnlineHandler);
		self.xmpp.on('stanza', self.onStanzaHandler);
		self.xmpp.on('error', self.onErrorHandler);
		self.xmpp.on('offline', self.onOfflineHandler);
		self.xmpp.on('disconnect', self.onDisconnectHandler);
		self.xmpp.on('reconnect', self.onReconnectHandler);
	};

	this.onOnlineHandler = function () {

		self.handlers.push(new Messages(self));
		self.handlers.push(new Presence(self));
		self.handlers.push(new Roster(self));

		// query server features:
		self.xmpp.send(new Client.Stanza('iq', {type:'get', to:'gmail.com'})
			.c('query', {xmlns: 'http://jabber.org/protocol/disco#info'})
		);
		emitter.emit('online');
	}

	this.onDisconnectHandler = function() {
		console.log(clc.red('Disconnected...'));
	}

	this.onOfflineHandler = function() {
		console.log(clc.red('Client offline'));
	}

	this.onReconnectHandler = function() {
		console.log('Reconnecting...');
	}

	this.onStanzaHandler = function (stanza) {
		try {

			for (var i = 0; i < self.handlers.length; i++) {
				var handler = self.handlers[i];
				if (handler.handleStanza(stanza)) {
					return;
				}
			}

			// initial feature response:
			var query = stanza.getChild('query');
			if (query && query.attrs.xmlns === 'http://jabber.org/protocol/disco#info') {
				var features = query.getChildren('feature');
				var identity = query.getChild('identity');
				// server identity:
				if (identity) {
					console.log('Welcome to ' + identity.attrs.name);
					console.log('Server has following features:');
					for (var i=0; i<features.length; i++) {
						var featureName = features[i].attrs.var;
						emitter.emit('feature', featureName);
						self.handleFeature(featureName);
						console.log('  ' + featureName);
					}
					return;
				} else {
					// service discovery:
					var from = stanza.attrs.from;
					var id = stanza.attrs.id;
					var r = new Client.Stanza('iq', {
						type: 'result',
						from: self.jid,
						to: from,
						id: id
					});
					var q = r.c('query', {xmlns:'http://jabber.org/protocol/disco#info'});
					q.c('identity', {category:'automation', type:'rpc'});
					q.c('feature', {'var':'jabber:iq:rpc'});
					self.xmpp.send(r);
					return;
				}
			}
	
		} catch (e) {
			console.log(clc.red(e.stack));
		}
		// show unhandled stanzas:
		var attString = "";
		for (var s in stanza.attrs) {
			if (!stanza.attrs.hasOwnProperty(s)) continue;
			attString += ' ' + s + '=' + stanza[s];
		}
		self.log(clc.whiteBright('['+stanza.name+']') + attString);
		self.logXml(stanza.toString());
	}

	

	this.handleFeature = function (featureName) {
		switch (featureName) {

			case 'google:mail:notify':
				self.handlers.push(new GmailNotify(self));
			break;

		}
	}

	this.onErrorHandler = function (e) {
		self.log(e.stack);
		process.exit();
	}

	this.setModel = function(model){
		this.model = model;
	}

	this.send = function (jid, text) {
		this.xmpp.send(new Client.Stanza('message', { 
				to: jid,
                type: 'chat'}
            ).c('body').t(text)
		);
	}

	/**
	 * @param show - Your current presence state ['away', 'dnd', 'xa', 'chat']
	 * @param status - (optional) free text as your status message
	 */
	this.setStatus = function (status, text) {
		var presence = new Client.Stanza('presence', {})
			.c('show').t(status).up();
		if (text !== "") {
			presence.c('status').t(text)
		}
		self.xmpp.send(presence);
	}

	/**
	 * 
	 */
	this.setChatState = function (to, state) {
		
	}


	

	this.log = function(text) {
		console.log(text);
	}

	this.logXml = function (xmlString) {
		self.log(clc.blackBright(xmlString.split('><').join('>\n\t<')));
	}
};



module.exports = new Controller2();