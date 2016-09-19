module.exports = function(PRM, socket){
	socket.on('req.game_buff_send', function(data){
		console.log(data)
		PRM.io.to(data.game_id).emit('res.game_buff_send', {
			turn_index: data.turn_index + 1, 
			seed_index: data.seed_index + 1, 
			unit_alias: data.unit_alias,
			buffs: data.buffs
		});
	});

	socket.on('req.game_end', function(data){
		PRM.cols.games.findById(data.game_id, function(err, game){
			game.status = "done";
			game.markModified("status");

			if (data.winner_id != undefined){
				game.winner_id = data.winner_id;
				game.markModified("winner_id");
			};

			game.save(function(){
				PRM.io.to(data.game_id).emit('res.game_end', "end_game");
			})
		})
	})

	socket.on('req.game_disconnect', function(game_id){
		socket.leave(game_id);
	});
}