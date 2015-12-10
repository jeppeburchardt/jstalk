module.exports = {

	ADD_CONTACT: 'ADD_CONTACT',
	SET_PRESENCE: 'SET_PRESENCE',
	SET_DISPLAY_NAME: 'SET_DISPLAY_NAME',

	addContact: function(jid) {
		return {
			type: 'ADD_CONTACT',
			jid: jid,
		}
	},

	updateStatus: function(jid, status) {
		return {
			type: 'SET_PRESENCE',
			jid: jid,
			status: status,
		}
	},

	updateDisplayName: function(jid, name) {
		return {
			type: 'SET_DISPLAY_NAME',
			jid: jid, 
			name: name,
		}
	},

}