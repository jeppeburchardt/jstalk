var store = require('../store');
var actions = require('../actions/chat');

var Messages = function(controller) {

	var self = this;

	self.controller = controller;

	this.handleStanza = function(stanza) {
		if (stanza.is('message') && stanza.attrs.type === 'chat') {
			var body = stanza.getChild('body');
			if (body) {
				self.controller.model.addChatEntry(stanza.attrs.from, 'from', body.getText());
				store.dispatch(actions.addChatEntry(stanza.attrs.from, '', body.getText()));
				return true;
			}
			if (stanza.getChild('composing')) {
				self.controller.model.setChatState(stanza.attrs.from, 'composing');
				return true;
			}
			if (stanza.getChild('inactive')) {
				self.controller.model.setChatState(stanza.attrs.from, 'inactive');
				return true;
			}
			if (stanza.getChild('paused')) {
				self.controller.model.setChatState(stanza.attrs.from, 'paused');
				return true;
			}
			if (stanza.getChild('active')) {
				self.controller.model.setChatState(stanza.attrs.from, 'active');
				return true;
			}
		}
	}

}

exports.Messages = Messages;