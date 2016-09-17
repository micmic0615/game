var SERVER = function(){
	var PRM = this;
	var glob = require('glob');
	var moment = require('moment')(); 
	var uuid = require('./app/controllers/uuid.js');
	
	PRM.cols = {};
	PRM.app = require('express')();
	PRM.http = require("http").Server(PRM.app);
	PRM.io = require('socket.io')(PRM.http);
	PRM.mongoose = require('mongoose');
	PRM.clone_obj = require('./app/controllers/clone_obj.js');

	PRM.config = {
		port: 9090,
		views:'app/views/',
		db: 'mongodb://localhost/game_server'
	}

	PRM.app.set('views', './' + PRM.config.views);
	PRM.app.set('view engine', 'ejs');
	PRM.app.get("/", function(req, res){res.render("index.ejs")});

	PRM.mongoose.connect(PRM.config.db );
	PRM.mongoose.connection.on('open', function(ref) {
		PRM.cols.users = PRM.mongoose.model("users", require('./app/models/users.js').bind(PRM)());
		PRM.cols.games = PRM.mongoose.model("games", require('./app/models/games.js').bind(PRM)());

		glob("*app/controllers/sockets/*.js", function(err, files){
			PRM.io.on('connection', function (socket) {
				PRM.socket = socket;
				for (var i = 0; i < files.length; ++i) {
					var file = files[i];
					run_socket(file, file.split("/sockets/")[1].split(".")[0]);
				}

				function run_socket(file, listener){
					socket.on('req.' + listener, function(data){require('./'+file)().bind(PRM)(data, listener)}.bind(PRM))
				}
			});

			PRM.http.listen(PRM.config.port);
			console.log(moment.format('MMMM Do YYYY, h:mm:ss a') +  " -  server running at http://localhost:" + PRM.config.port);
		})
	})
}

module.exports = new SERVER();

