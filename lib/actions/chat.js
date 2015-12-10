module.exports = {

	ADD_CHAT_ENTRY: 'ADD_CHAT_ENTRY',
	SEND_MESSAGE: 'SEND_MESSAGE',

	addChatEntry: function(from, to, text) {
		return {
			type: 'ADD_CHAT_ENTRY',
			from: from,
			to: to,
			text: text,
		}
	},

	sendMessage: function(to, text) {
		return {
			type: 'SEND_MESSAGE',
			to: to,
			text: text,
		}
	},

}