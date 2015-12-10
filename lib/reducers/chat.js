var ADD_CHAT_ENTRY = require('../actions/chat').ADD_CHAT_ENTRY,
	SEND_MESSAGE = require('../actions/chat').SEND_MESSAGE;

module.exports = function chat(state, action) {

	switch(action.type) {

		case SEND_MESSAGE:
			break;

		case ADD_CHAT_ENTRY:
			return state.slice().push({
				from: action.from,
				to: action.to,
				text: action.text,
			});

		default:
			return state;

	}

}