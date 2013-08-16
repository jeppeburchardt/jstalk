

/**
 * https://developers.google.com/talk/jep_extensions/gmail
 */
var GmailNotify = function (controller) {

	var self = this;

	this.controller = controller;

	this.handleStanza = function () {
		if (stanza.is('iq')) {

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
				return true;
			}

			var newMail = stanza.getChild('new-mail');
			if (newMail) {
				//view should handle this:
				console.log('[gmail] New mail');
				//acturely this should be a mail search request
			}
	}
};


exports.GmailNotify = GmailNotify;