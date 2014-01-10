var xmpp = require('node-xmpp');
var clc = require('cli-color');


// https://developers.google.com/talk/jep_extensions/gmail
var GmailNotify = function (controller) {

	var self = this;

	this.controller = controller;
	this.lastResultTime = '';
	this.tids = [];
	this.fakeContact = null;

	this.handleStanza = function (stanza) {
		if (stanza.is('iq')) {

			var mailbox = stanza.getChild('mailbox');
			if (mailbox) {
				self.lastResultTime = mailbox.attrs['result-time'];
				var mails  = mailbox.getChildren('mail-thread-info');
				for (var i=0; i<mails.length; i++) {
					//view should handle this:
					var mail = mails[i];
					var threadID = mail.attrs['tid'];
					if (self.tids.indexOf(threadID) > -1) {
						continue;
					}
					self.tids.push(threadID);
					var from = mail.getChild('senders').getChildren('sender').map(function (sender) {
						return sender.attrs.name ? sender.attrs.name + ' (' + sender.attrs.address + ')' : sender.attrs.address;
					}).join(', ');
					var to = 'fake@notify.gmail.com'; //stanza.attrs['from'];
					var subject = mail.getChild('subject').getText();
					//console.log('[gmail] ' + clc.whiteBright(mail.getChild('subject').getText()) + ' From: ' + clc.blackBright(from));
					self.controller.model.addChatEntry(to, 'from', subject + ' From: ' + from);
				}
				return true;
			}

			var newMail = stanza.getChild('new-mail');
			if (newMail) {
				self.requestNewMail();
				return true;
			}
		}
	}


	this.requestNewMail = function () {
		var r = new xmpp.Element('iq', {
			type: 'get',
			to: self.controller.jid,
			id: 'gmail-notify-request-' + self.lastResultTime
		});
		if (self.lastResultTime !== '') {
			r.c('query', {xmlns:'google:mail:notify', 'newer-than-time':self.lastResultTime});
		} else {
			r.c('query', {xmlns:'google:mail:notify'});
		}
		self.controller.xmpp.send(r);
	};

	this.requestNewMail();

	this.fakeContact = this.controller.model.getOrCreateRoster('fake@notify.gmail.com');
	this.controller.model.setContactName('fake@notify.gmail.com', 'GMail');
};


exports.GmailNotify = GmailNotify;