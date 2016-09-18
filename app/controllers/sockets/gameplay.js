module.exports = function(PRM, socket){
	var calc_turn = require("../gameplay/turns.js")(PRM);

	socket.on('req.game_extend', function(data){
		calc_turn.initialize(data.game_id, data.game_index, function(turn_data){
			PRM.io.to(data.game_id).emit('res.game_extend', turn_data);
		})
	})

	socket.on('req.game_buff_eval', function(data){
		calc_turn.update_buffs(data.game_id, data.game_index, data.user_id, data.prebuffs, function(turn_data){
			PRM.io.to(data.game_id).emit('res.game_buff_eval', turn_data);
		})
	})

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
	})
}