var xmpp = require('node-xmpp');


// https://developers.google.com/talk/jep_extensions/roster_attributes
var GoogleRoster = function (controller) {

	var self = this;

	this.controller = controller;

	this.handleStanza = function (stanza) {
		
		if (stanza.is('iq')) {
			var query = stanza.getChild('query');
			if (query && query.attrs.xmlns === 'jabber:iq:roster') {
				var items = query.getChildren('item');
				for (var i=0; i < items.length; i++) {
					var item = items[i];
					switch(item.attrs.subscription.toLowerCase()) {
						case 'both':
							self.controller.model.getOrCreateRoster(item.attrs.jid);
							if (item.attrs.name) {
								self.controller.model.setContactName(item.attrs.jid, item.attrs.name);
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
	}

	this.requestRooster = function () {

		var r = new xmpp.Element('iq', {
			type: 'get',
			to: self.controller.jid,
			id: 'google-roster'
		}).c('query', {
			'xmlns': 'jabber:iq:roster',
			'xmlns:gr': 'google:roster',
			'gr:ext': '2'
		});
		self.controller.xmpp.send(r);
	}


	this.requestRooster();
};


exports.GoogleRoster = GoogleRoster;