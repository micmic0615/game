module.exports = function(){return function(data, emitter){var PRM = this;	
	var calc_turn = require("../gameplay/turns.js")(PRM);
	calc_turn.update_buffs(data.game_id, data.game_index, data.user_id, data.prebuffs, function(turn_data){
		PRM.io.to(data.game_id).emit('res.'+ emitter , turn_data);
	})
}}