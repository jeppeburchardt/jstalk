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
		self.xmpp.send(new xmpp.Element('presence', {})
			.c('show').t('chat').up()
			.c('status').t('Using jsTalk v 0.0.1')
		);
		self.xmpp.send(new xmpp.Element('iq', { id: 'roster_0', type: 'get' })
			.c('query', { xmlns: 'jabber:iq:roster' })
		);
		emitter.emit('online');
	}

	this.onStanzaHandler = function (stanza) {
		var attString = "";
		for (var s in stanza.attrs) {
			if (!stanza.attrs.hasOwnProperty(s)) continue;
			attString += ' ' + s + '=' + stanza[s];
		}
		self.log(clc.whiteBright('['+stanza.name+']') + attString);
		self.logXml(stanza.toString());

		if (stanza.attrs.type === 'error') {
			self.log('error');
		} else if (stanza.is('message') && stanza.attrs.type === 'chat') {
			var body = stanza.getChild('body');
			if (body) {
				self.model.addChatEntry(stanza.attrs.from, 'from', body.getText());
			}
		} else if (stanza.is('iq')) {
			var query = stanza.getChild('query');
			if (query.attrs.xmlns === 'jabber:iq:roster') {
				var items = query.getChildren('item');
				for (var i=0; i < items.length; i++) {
					if (items[i].attrs.subscription === 'both')
						self.model.getOrCreateRoster(items[i].attrs.jid);
				}
			}
		} else if (stanza.is('presence')) {
			var status = stanza.getChild('status');
			var show = stanza.getChild('show');
			var priority = parseInt(stanza.getChild('priority').getText());
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
				self.model.changeStatus(stanza.attrs.from, state, statusText, priority, capsNode, capsVersion, capsExt);
				//function (jid, status, statusText, priority, capsNode, capsVersion, capsExt)
			}
		}
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