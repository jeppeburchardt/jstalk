var ADD_CONTACT = require('../actions/roster').ADD_CONTACT,
	SET_DISPLAY_NAME = require('../actions/roster').SET_DISPLAY_NAME,
	SET_PRESENCE = require('../actions/roster').SET_PRESENCE;

module.exports = function roster(state, action) {

	switch(action.type) {

		case ADD_CONTACT:
			// if (!state[action.jid]) {
			// 	state[action.jid] = {
			// 		jid: action.jid
			// 	}
			// }
			//return state.map(function(){});
			var c = state.slice();
			c.push({
				jid: action.jid
			});
			return c;

		case SET_DISPLAY_NAME:
			return state.map(function(contact) {
				if (contact.jid === action.jid) {
					contact.name = action.name;
				}
				return contact;
			});

		case SET_PRESENCE:
			return state.map(function(contact) {
				if (contact.jid === action.jid) {
					contact.status = action.status;
				}
				return contact;
			});


		default:
			return state;

	}

}