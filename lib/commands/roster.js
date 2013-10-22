
var Roster = function(model, view, controller) {

	var self = this;

	self.model = model;
	self.view = view;
	self.controller = controller;

	this.handleCommand = function (line) {
		if (line.indexOf('roster')) {
			self.parseCommand(line);
			return true;
		}
	}

	this.parseCommand = function (line) {
		self.view.printRoster();
	}

};


exports.Roster = Roster;