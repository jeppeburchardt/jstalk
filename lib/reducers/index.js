var roster = require('./roster'),
	chat = require('./chat');

module.exports = function(state, action) {
	return {
		roster: roster(state.roster, action),
		chat: chat(state.chat, action),
	}
}
