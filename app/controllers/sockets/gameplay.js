module.exports = function(PRM, socket){
	socket.on('req.game_buff_send', function(data){
		PRM.io.to(data.game_id).emit('res.game_buff_send', {
			turn_index: data.turn_index + 1, 
			seed_index: data.seed_index + 1, 
			unit_alias: data.unit_alias,
			buffs: data.buffs
		});

		PRM.cols.games.findById(data.game_id, function(err, game){
			var game_end_keys = Object.keys(game.end_signals);
			for (var i = 0; i < game_end_keys.length; ++i) {
				game.end_signals[game_end_keys[i]] = false;				
			}

			game.markModified("end_signals");
			game.save(function(){});
		});
	});

	socket.on('req.game_end', function(data){
		PRM.cols.games.findById(data.game_id, function(err, game){
			var valid = true;
			game.end_signals[data.user_id] = true;

			var game_end_keys = Object.keys(game.end_signals);
			for (var i = 0; i < game_end_keys.length; ++i) {
				var p = game.end_signals[game_end_keys[i]];
				if (p == false){valid = false};
			}
			
			if (valid){
				game.status = "done";
				game.markModified("status");
				game.markModified("end_signals");

				if (data.winner_id != undefined){
					game.winner_id = data.winner_id;
					game.markModified("winner_id");
				};

				game.save(function(){
					PRM.io.to(data.game_id).emit('res.game_end', "end_game");
				})
			} else {
				game.markModified("end_signals");
				game.save();
			}		
		})
	})

	socket.on('req.game_disconnect', function(game_id){
		socket.leave(game_id);
	});
}