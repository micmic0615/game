module.exports = function(){return function(data, emitter){var PRM = this;	
	var calc_turn = require("../gameplay/turns.js")(PRM);

	PRM.cols.users.findById(data._id, function(err, user){
		PRM.cols.games.findOne({user_num: 1}, function(err, game){
			if (game != undefined && game != null ){
				var game_id = String(game._id);
				PRM.socket.join(game_id);
				game.user_num = 2;
				game.user_data.push(data);
				game.status = "playing";
				
				game.save(function(){					
					calc_turn.initialize(game_id, 0, function(turn_data){
						PRM.io.to(game_id).emit('res.'+ emitter + ".found", {game: game, turn_data: turn_data});
					});
				})	
			} else {
				var game = new PRM.cols.games();
				var game_id = String(game._id);
				PRM.socket.join(game_id);
				
				game.generate();
				game.user_data.push(data);
					
				game.save(function(){
					PRM.io.to(game_id).emit('res.'+ emitter + ".finding", user);
				})		
			}
		})
	})
}}