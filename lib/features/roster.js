var xmpp = require('node-xmpp');

var Roster = function (controller) {

	var self = this;

	this.controller = controller;

	this.queryRoster = function() {
		self.controller.xmpp.send(new xmpp.Element('iq', { id: 'roster_0', type: 'get' })
			.c('query', { xmlns: 'jabber:iq:roster' })
		);
	};

	this.requestGoogleRooster = function () {
		var r = new xmpp.Element('iq', {
			type: 'get',
			to: self.controller.jid,
			id: 'google-roster_0'
		}).c('query', {
			'xmlns': 'jabber:iq:roster',
			'xmlns:gr': 'google:roster',
			'gr:ext': '2'
		});
		self.controller.xmpp.send(r);
	}

	this.handleStanza = function(stanza) {

		if (stanza.is('iq')) {
			var query = stanza.getChild('query');
			if (query && query.attrs.xmlns === 'jabber:iq:roster') {
				var items = query.getChildren('item');
				for (var i=0; i < items.length; i++) {
					switch(items[i].attrs.subscription.toLowerCase()) {
						case 'both':
							self.controller.model.getOrCreateRoster(items[i].attrs.jid);
							if (items[i].attrs.name) {
								self.controller.model.setContactName(items[i].attrs.jid, items[i].attrs.name);
							}
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

	controller.on('feature', function(featureName) {
		if (featureName == 'google:roster') {
			self.requestGoogleRooster();
		}
	});
}

exports.Roster = Roster;