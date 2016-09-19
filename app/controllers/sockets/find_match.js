module.exports = function(PRM, socket){
	socket.on('req.find_match', function(data){
		PRM.cols.users.findById(data._id, function(err, user){
			PRM.cols.games.findOne({$and:[{user_num: 1}, {status: "waiting"}]}, function(err, game){
				if (game != undefined && game != null){
					var game_id = String(game._id);

					if (game.user_data[0]._id != data._id){
						socket.join(game_id);
						game.user_num = 2;
						game.user_data.push(data);
						game.status = "playing";
						
						game.save(function(){		
							var random_seed = [];
							while(random_seed.length < 1000){random_seed.push(Math.round(Math.random()*1000)/1000)};
							PRM.io.to(game_id).emit('res.find_match.found', {game: game, turn_data: [], random_seed: random_seed});
						})	
					} else {
						socket.leave(game_id);
						PRM.cols.games.findByIdAndRemove(game_id, function(err){create_room()});
					}
				} else {
					create_room();
				}

				function create_room(){
					var game = new PRM.cols.games();
					var game_id = String(game._id);
					game.generate();
					game.user_data.push(data);
						
					game.save(function(){
						socket.join(game_id);
						PRM.io.to(game_id).emit('res.find_match.finding', user);
					})		
				}
			})
		})
	})

	socket.on('req.find_match.ready', function(game_id){
		PRM.io.to(game_id).emit('res.find_match.ready', 'game start!');
	})
}