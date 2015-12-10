var redux = require('redux'),
	reducers = require('./reducers');

var store = redux.createStore(reducers, {
	roster: [],
	chat: [],
});

store.subscribe(function() {
	console.log('store changed', store.getState());
});

module.exports = store;
