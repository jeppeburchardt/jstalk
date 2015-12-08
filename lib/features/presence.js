var Client = require('node-xmpp-client');

var Presence = function (controller) {

	var self = this;

	self.controller = controller;

	this.handleStanza = function(stanza) {
		if (stanza.is('presence')) {
			var status = stanza.getChild('status');
			var show = stanza.getChild('show');
			var priority = stanza.getChild('priority');
			var caps = stanza.getChild('c');
			
			var type = stanza.attrs.type;
			if (type === 'unavailable') {
				var priorityInt = priority ? parseInt(priority.getText()) : 0;
				self.controller.model.changeStatus(stanza.attrs.from, 'offline', '', priorityInt);
				return true;
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
			self.controller.model.changeStatus(stanza.attrs.from, state, statusText, priorityInt, capsNode, capsVersion, capsExt);
			return true;
		}
	}

	this.sendInitialPresence = function () {
		self.controller.xmpp.send(new Client.Stanza('presence', {})
			.c('show').t('chat').up()
		);
	}

	this.sendInitialPresence();
}

exports.Presence = Presence;