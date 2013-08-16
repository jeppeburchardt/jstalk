var events = require('events');
var xmpp = require('node-xmpp');

// only for debugging purpose:
var clc = require('cli-color');

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


	this.sendSetIqWithCallback = function(xml, callback) {
		var id = 'ID' + new Date().getTime();
		xml.attrs.id = id;
		self.callbacks[id] = callback;
		self.xmpp.send(xml);
	}

	this.connect = function(jid, password, host, port) {

		self.jid = jid;

		self.xmpp = new xmpp.Client({
			jid: jid,
			password: password,
			host: host,
			port: port
		});

		self.xmpp.on('online', self.onOnlineHandler);
		self.xmpp.on('stanza', self.onStanzaHandler);
		self.xmpp.on('error', self.onErrorHandler);
	};

	this.onOnlineHandler = function () {
		// send presence
		self.xmpp.send(new xmpp.Element('presence', {})
			.c('show').t('chat').up()
		);
		// query roster
		self.xmpp.send(new xmpp.Element('iq', { id: 'roster_0', type: 'get' })
			.c('query', { xmlns: 'jabber:iq:roster' })
		);
		// query server features:
		self.xmpp.send(new xmpp.Element('iq', {type:'get', to:'gmail.com'})
			.c('query', {xmlns: 'http://jabber.org/protocol/disco#info'})
		);
		// test:
		emitter.emit('online');
	}

	this.onStanzaHandler = function (stanza) {
		try {
			if (stanza.attrs.type === 'error') {
				// error handling?
				// not yet... stanza will be displayed
			} else if (stanza.is('message') && stanza.attrs.type === 'chat') {
				var body = stanza.getChild('body');
				if (body) {
					self.model.addChatEntry(stanza.attrs.from, 'from', body.getText());
					return;
				}
				if (stanza.getChild('composing')) {
					self.model.setChatState(stanza.attrs.from, 'composing');
					return;
				}
				if (stanza.getChild('inactive')) {
					self.model.setChatState(stanza.attrs.from, 'inactive');
					return;
				}
				if (stanza.getChild('paused')) {
					self.model.setChatState(stanza.attrs.from, 'paused');
					return;
				}
				if (stanza.getChild('active')) {
					self.model.setChatState(stanza.attrs.from, 'active');
					return;
				}


			} else if (stanza.is('iq')) {
				if (stanza.attrs.id && self.callbacks[stanza.attrs.id]) {
					self.callbacks[stanza.attrs.id](stanza);
					delete self.callbacks[stanza.attrs.id];
					return;
				}
				var query = stanza.getChild('query');
				if (query && query.attrs.xmlns === 'jabber:iq:roster') {
					var items = query.getChildren('item');
					for (var i=0; i < items.length; i++) {
						switch(items[i].attrs.subscription.toLowerCase()) {
							case 'both':
								self.model.getOrCreateRoster(items[i].attrs.jid);
								break;
							default:
								self.model.getOrCreateRoster(items[i].attrs.jid);
								self.model.changeStatus(items[i].attrs.jid, 'pending', '');
								break;
						}
					}
					return;
				}
				if (query && query.attrs.xmlns === 'http://jabber.org/protocol/disco#info') {
					var features = query.getChildren('feature');
					var identity = query.getChild('identity');
					console.log('Welcome to ' + identity.attrs.name);
					console.log('Server has following features:');
					for (var i=0; i<features.length; i++) {
						var featureName = features[i].attrs.var;
						emitter.emit('feature', featureName);
						self.handleFeature(featureName);
						console.log('  ' + featureName);
					}
					return;
				}
				var mailbox = stanza.getChild('mailbox');
				if (mailbox) {
					var mails  = mailbox.getChildren('mail-thread-info');
					for (var i=0; i<mails.length; i++) {
						//view should handle this:
						var mail = mails[i];
						var from = mail.getChild('senders').getChildren('sender').map(function (sender) {
							return sender.attrs.name + ' (' + sender.attrs.address + ')';
						}).join(', ');
						console.log('[gmail] New mail ' + clc.whiteBright(mail.getChild('subject').getText()) + ' From: ' + clc.blackBright(from));
					}
					return;
				}
				// google extensions:
				// https://developers.google.com/talk/jep_extensions/gmail
				// https://developers.google.com/talk/jep_extensions/otr
				// https://developers.google.com/talk/jep_extensions/roster_attributes

				// gmail notify:
				// <iq type='set'
				//     from='romeo@gmail.com'
				//     to='romeo@gmail.com/orchard'
				//     id='mail-request-2'>
				//   <new-mail xmlns='google:mail:notify' />
				// </iq>
				// client response to notify:
				// <iq type='result'
				//     from='romeo@gmail.com'
				//     to='romeo@gmail.com/orchard'
				//     id='mail-request-2' />

			} else if (stanza.is('presence')) {
				var status = stanza.getChild('status');
				var show = stanza.getChild('show');
				var priority = stanza.getChild('priority');
				var caps = stanza.getChild('c');
				
				var type = stanza.attrs.type;
				if (type === 'unavailable') {
					var priorityInt = priority ? parseInt(priority.getText()) : 0;
					self.model.changeStatus(stanza.attrs.from, 'offline', '', priorityInt);
					return;
				}

				var statusText = status ? status.getText() : '';
				var state = show ? show.getText() : 'online';
				state = state === 'chat' ? 'online' : state; //chat means online
				var capsNode = '', capsVersion = '', capsExt = '';
				if (caps) {
					capsNode = caps.attrs.node;
					capsVersion = caps.attrs.ver;
					capsExt = caps.attrs.ext;
				}
				var priorityInt = priority ? parseInt(priority.getText()) : 0;
				self.model.changeStatus(stanza.attrs.from, state, statusText, priorityInt, capsNode, capsVersion, capsExt);
				return;
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
				self.xmpp.send(new xmpp.Element('iq', {
						type: 'get',
						to: self.jid,
						id: 'gmail-notify-request'
					}).c('query', {xmlns:'google:mail:notify'})
				);
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
		this.xmpp.send(new xmpp.Element('message', { 
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
		var presence = new xmpp.Element('presence', {})
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