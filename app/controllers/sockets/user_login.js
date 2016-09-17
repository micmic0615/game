module.exports = function(){return function(data, emitter){var PRM = this;
	if (data._id != undefined){
		PRM.cols.users.findById(data._id, function(err, user){
			if (user != undefined && user != null){
				// PRM.socket.join("abc123");
				PRM.socket.emit('res.'+ emitter, user);
			} else {
				var user = new PRM.cols.users()
				user.generate(data, function(){
					// PRM.socket.join("abc123");
					PRM.socket.emit('res.'+ emitter, user);
				})
			}
		})
	} else {
		var user = new PRM.cols.users()
		user.generate(data, function(){
			// PRM.socket.join("abc123");
			PRM.socket.emit('res.'+ emitter, user);
		})
	}
}}