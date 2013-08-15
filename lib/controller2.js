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


	this.connect = function(jid, password, host, port) {

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
		emitter.emit('online');
	}

	this.onStanzaHandler = function (stanza) {
		if (stanza.attrs.type === 'error') {
			self.log('error');
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


		} else if (stanza.is('iq')) {
			var query = stanza.getChild('query');
			if (query.attrs.xmlns === 'jabber:iq:roster') {
				var items = query.getChildren('item');
				for (var i=0; i < items.length; i++) {
					if (items[i].attrs.subscription === 'both')
						self.model.getOrCreateRoster(items[i].attrs.jid);
				}
				return;
			}
			// google extensions:
			// https://developers.google.com/talk/jep_extensions/gmail
			// https://developers.google.com/talk/jep_extensions/otr
			// https://developers.google.com/talk/jep_extensions/roster_attributes

			// gmail notify support response:
			// <iq type='result' to='romeo@gmail.com' from='gmail.com'>
			//   <query xmlns='http://jabber.org/protocol/disco#info'>
			//     ...
			//     <feature var='google:mail:notify'/>
			//     ...
			//   </query>
			// </iq>

			// subscribe to emails:
			// <iq type='get'
			//     from='romeo@gmail.com/orchard'	
			//     to='romeo@gmail.com'
			//     id='mail-request-1'>
			//   <query xmlns='google:mail:notify' />
			// </iq>

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
			if (status) {
				var statusText = status.getText();
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
			var type = stanza.attrs.type;
			if (type === 'unavailable') {
				var priorityInt = priority ? parseInt(priority.getText()) : 0;
				self.model.changeStatus(stanza.attrs.from, 'offline', '', priorityInt);
				return;
			}
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

	this.onErrorHandler = function (e) {
		self.log(e);
		process.exit();
	}

	this.setModel = function(model){
		this.model = model;
	}

	this.send = function (jid, text) {
		this.xmpp.send(new xmpp.Element('message', { 
				to: jid,
                type: 'chat'}
            )
			.c('body').t(text)
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