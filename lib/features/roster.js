var Client = require('node-xmpp-client');

var Roster = function (controller) {

	var self = this;

	this.controller = controller;

	this.queryRoster = function() {
		self.controller.xmpp.send(new Client.Stanza('iq', { id: 'roster_0', type: 'get' })
			.c('query', { xmlns: 'jabber:iq:roster' })
		);
	};

	this.handleStanza = function(stanza) {


		if (stanza.is('iq')) {
			var query = stanza.getChild('query');
			if (query && query.attrs.xmlns === 'jabber:iq:roster') {
				var items = query.getChildren('item');
				for (var i=0; i < items.length; i++) {
					switch(items[i].attrs.subscription.toLowerCase()) {
						case 'both':
							self.controller.model.getOrCreateRoster(items[i].attrs.jid);
							break;
						default:
							self.controller.model.getOrCreateRoster(items[i].attrs.jid);
							self.controller.model.changeStatus(items[i].attrs.jid, 'pending', '');
							break;
					}
				}
				return true;
			}
		}


	};

	this.queryRoster();
}

exports.Roster = Roster;