module.exports = function(PRM, socket){
	socket.on('req.user_login', function(data){
		var rooms = PRM.io.sockets.adapter.sids[socket.id]; for(var room in rooms) { socket.leave(room); }
		if (data._id != undefined){
			PRM.cols.users.findById(data._id, function(err, user){
				if (user != undefined && user != null){
					user.name = data.name;
					user.markModified("name");

					user.save(function(){
						var user_id = user._id;
						socket.join(user_id);
						PRM.io.to(user_id).emit('res.user_login', user);
					});					
				} else {
					var user = new PRM.cols.users()
					var user_id = user._id;
					socket.join(user_id);
					user.generate(data, function(){
						PRM.io.to(user_id).emit('res.user_login', user);
					})
				}
			})
		} else {
			var user = new PRM.cols.users();
			var user_id = user._id;
			socket.join(user_id);
			user.generate(data, function(){
				PRM.io.to(user_id).emit('res.user_login', user);
			})
		}
	})
}