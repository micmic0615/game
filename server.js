var SERVER = function(){
	this.app = require('express')();
	this.uuid = require('./app/controllers/uuid.js');
	this.moment = require('moment')(); 
	this.mongoose = require('mongoose');
	this.cols = {};
	this.http = require("http").Server(this.app);
	this.io = require('socket.io')(this.http);

	this.config = {
		port: 9090,
		views:'app/views/',
		db: 'mongodb://localhost/game_server'
	}

	this.mongoose.connect(this.config.db );

	this.app.set('views', './' + this.config.views);
	this.app.set('view engine', 'ejs');
	this.app.get("/", function(req, res){res.render("index.ejs")});

	
	this.mongoose.connection.on('open', function(ref) {
		this.cols.users = this.mongoose.model("users", require('./app/models/users.js').bind(this)());

		this.io.on('connection', function (socket) {
			socket.on('req.user_login', function (data) { 
				
				if (data._id != undefined){
					this.cols.users.findById(data._id, function(err, user){
						if (user != undefined && user != null){
							socket.join("abc123");
							socket.emit('res.user_login', user);
						} else {
							var user = new this.cols.users()
							user.generate(data, function(){
								socket.join("abc123");
								socket.emit('res.user_login', user);
							})
						}
					})
				} else {
					var user = new this.cols.users()
					user.generate(data, function(){
						socket.join("abc123");
						socket.emit('res.user_login', user);
					})
				}
			}.bind(this));


			socket.on('req.select_buff', function (data) { 
				console.log(data)
				this.io.to("abc123").emit('res.select_buff', {user:data.user, buff:data.buff});
			}.bind(this))
		}.bind(this));

		this.http.listen(this.config.port);
		console.log(this.moment.format('MMMM Do YYYY, h:mm:ss a') +  " -  server running at http://localhost:" + this.config.port);
	}.bind(this))
}

module.exports = new SERVER();

