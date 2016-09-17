var PRM, SELF = {};
var turns_actions = require("./turns_actions.js")()

var combat = {
	margin: 40,
	world_width: 853,

	flinch_push_base: 15,
	flinch_push_duration: 15,
	flinch_push_movement: 2,
	flinch_push_max_duration: 30,

	attack_distance: 90,

	cast_time_duration: 10,
	cast_channel_duration: 30,
	cast_repel_factor: 2,

	knockback_damage_factor: 1,

	unit_movespeed: 2.5,

	buffs_use_max: 10,

	buffs_max: 4,
	buffs_foresight:2,

	stamina_regen_factor: 0.04,
	stamina_regen_duration: 5,

	bonus_buff_chance: 25,

	blocks_max: 10,

	debuff_proc_factor: 5,
	debuff_proc_requirement: 20
};

SELF.initialize = function(game_id, callback){
	PRM.cols.games.findById(game_id, function(err, game){
		var unit_constants = {
			"hero": game.user_data[0].stats,
			"enemy": game.user_data[1].stats
		}

		var unit_stats = {
			"hero": game.user_data[0].bases,
			"enemy": game.user_data[1].bases,
		};

		unit_stats.hero.locX = 381.5;
		unit_stats.enemy.locX = 471.5;

		var turn = {
			phase: -1,
			index: 0,
			previous: null,
			sequence: game.turn_data,
			sequence_max: 10,
			foresight: 25,
			reset: false,
		}

		function calculate_turns(index, splice) {
			var units = {};
			var turn_agility = 0;

			var keys = Object.keys(unit_stats);
			var current = turn.sequence[index];
			
			var unit_buffs = unit_stats;

			for (var i = 0; i < keys.length; ++i) {
				var p = keys[i];
				var unit = unit_constants[p];

				unit._agi = { factor: 1, total: 0, actions: 0 };

				if (current != undefined) {
					for (var i2 = 0; i2 < current.unit_stats[p].buffs.length; ++i2) {
						var p2 = current.unit_stats[p].buffs[i2];
						if (p2.effects == "speed_up") {if (p2.duration >= turn.sequence_max) {unit._agi.factor += p2.factor} else {unit._agi.factor += p2.factor * (p2.duration / turn.sequence_max)}}
					}
				}

				unit._agi.total = unit.agility * unit._agi.factor;
				units[p] = unit;
				turn_agility += unit._agi.total;
			}

			for (var i = 0; i < keys.length; ++i) {
				var unit = units[keys[i]];

				unit._agi.actions = Math.round((unit._agi.total) / (turn_agility) * turn.sequence_max);

				if (unit._agi.actions >= turn.sequence_max) { unit._agi.actions = turn.sequence_max - (keys.length - 1) };
				if (unit._agi.actions <= 1) { unit._agi.actions = 1 };
			}

			var temp_sequence = [];

			while (temp_sequence.length < turn.sequence_max) {
				var origin_dice = [];
				for (var i = 0; i < keys.length; ++i) { var unit = units[keys[i]]; if (unit._agi.actions > 0) { origin_dice.push(keys[i]) } };
				var origin_random = Math.floor(Math.random() * origin_dice.length);
				var origin = origin_dice[origin_random];
				units[origin]._agi.actions--;

				var target_dice = [];
				for (var i = 0; i < keys.length; ++i) { if (keys[i] != origin) { target_dice.push(keys[i]) } };
				var target_random = Math.floor(Math.random() * target_dice.length);
				var target = target_dice[target_random];
				if (splice == undefined){var unit_stats_temp = PRM.clone_obj(unit_stats)} else {var unit_stats_temp = turn.sequence[index].PRM.clone_obj(unit_stats)};

				var damage_obj = {
					health: 0,
					defense: 0,
					stamina: 0,
					leech_health: 0
				};

				temp_sequence.push({
					evaluated: false,
					origin: origin,
					target: target,
					action: "",
					unit_stats: unit_stats_temp,
					force: 1,
					poise: 1,
					damage: {
						target: PRM.clone_obj(damage_obj),
						origin: PRM.clone_obj(damage_obj)
					}
				});
			};

			if (index == undefined) {
				for (var i = 0; i < temp_sequence.length; ++i) { turn.sequence.push(temp_sequence[i]) };
				evaluate_sequence(0);
			} else {
				var index_base = index;

				if (splice != undefined) { turn.sequence.splice(index, splice) };

				for (var i = 0; i < temp_sequence.length; ++i) {
					turn.sequence.splice(index, 0, temp_sequence[i]);
					index++
				};

				evaluate_sequence(index_base);
			}
		};

		function evaluate_sequence(index) {
			var current = turn.sequence[index];
			var next = turn.sequence[index + 1];

			if (!current.evaluated) {
				var origin = current.origin;
				var target = current.target;
				var fighters = [origin, target];

				var buff_effects = {};

				for (var u = 0; u < fighters.length; ++u) {
					var b = fighters[u];
					var next_unit = PRM.clone_obj(current.unit_stats[b]);

					for (var i = 0; i < next_unit.buffs.length; ++i) {
						var p = next_unit.buffs[i];
						if (p.duration > 0) { next_unit.buffs[i].duration-- } else { next_unit.buffs.splice(i, 1); i-- }
					}

					for (var i = 0; i < next_unit.debuffs.length; ++i) {
						var p = next_unit.debuffs[i];
						if (p.duration > 0) { next_unit.debuffs[i].duration-- } else { next_unit.debuffs.splice(i, 1); i-- }
					}

					var stamina_regen = unit_constants[b].stamina_max * combat.stamina_regen_factor;

					for (var i = 0; i < next_unit.staminaregen.length; ++i) {
						var p = next_unit.staminaregen[i];
						if (p > 0) {
						next_unit.staminaregen[i]--;
							if (next_unit.stamina + stamina_regen >= unit_constants[b].stamina_max) {
								next_unit.stamina = unit_constants[b].stamina_max;
							} else {
								next_unit.stamina += stamina_regen;
							}
						} else { next_unit.staminaregen.splice(i, 1); i-- }
					};

					buff_effects[b] = {
						health_dmg_add: 0,
						defense_dmg_add: 0,
						health_dmg_reflect_add: 0,
						reduce_dmg_divide: 1,
						defense_dmg_reflect_add: 0,
						blocks_add: 0,
						transmute_add: 0,
						force_add: 0,
						stamina_dmg_add: 0,
						stun_add: 0,
						stamina_heal_add: 0,
						health_heal_add: 0,
						lifesteal_add: 0,

						health_dmg_multiply: 1,
						defense_dmg_multiply: 1,
						stamina_dmg_multiply: 1,
						force_multiply: 1,
						reduce_dmg_subtract: 0,

						debuff_bleed_add: 0,
						debuff_encumber_add: 0,
						debuff_poison_add: 0,
					};

					for (var i = 0; i < current.unit_stats[b].buffs.length; ++i) {
						var p = current.unit_stats[b].buffs[i];
						var effects_check = p.effects.split("_")
						switch (effects_check[effects_check.length - 1]) {
							case "add": buff_effects[b][p.effects] += p.factor; break;
							case "multiply": buff_effects[b][p.effects] *= p.factor; break;
							case "subtract": buff_effects[b][p.effects] -= p.factor; break;
							case "divide": buff_effects[b][p.effects] /= p.factor; break;
						};
					};

					if (buff_effects[b]["health_heal_add"] > 0) {
						if (next_unit.health + buff_effects[b]["health_heal_add"] >= unit_constants[b].health_max) {next_unit.health = unit_constants[b].health_max}
						else {next_unit.health += buff_effects[b]["health_heal_add"]};
					};

					if (buff_effects[b]["stamina_heal_add"] > 0) {
						if (next_unit.stamina + buff_effects[b]["stamina_heal_add"] >= unit_constants[b].stamina_max) {next_unit.stamina = unit_constants[b].stamina_max}
						else {next_unit.stamina += buff_effects[b]["stamina_heal_add"]};
					};

					if (buff_effects[b]["blocks_add"] > 0) {
						if (next_unit.block + buff_effects[b]["blocks_add"] >= combat.blocks_max) {next_unit.block = combat.blocks_max} 
						else {next_unit.block += buff_effects[b]["blocks_add"]};
					};

					if (buff_effects[b]["transmute_add"] > 0) {
						if (next_unit.health - buff_effects[b]["transmute_add"] / 2 <= 0) {next_unit.health = 1}
						else {next_unit.health -= buff_effects[b]["transmute_add"] / 2};

						if (next_unit.defense + buff_effects[b]["transmute_add"] >= unit_constants[b].defense_max) {next_unit.defense = unit_constants[b].defense_max}
						else {next_unit.defense += buff_effects[b]["transmute_add"]};
					};

					next.unit_stats[b] = next_unit;
				};

				var stunned = false;
				for (var i = 0; i < next.unit_stats[origin].debuffs.length; ++i) {var p = next.unit_stats[origin].debuffs[i]; if (p.alias == "stun"){stunned = true}};

				if (!stunned){
					if (current.unit_stats[origin].stamina > 0) {
						var attack_chance = (current.unit_stats[origin].stamina / unit_constants[origin].stamina_max) * 100;
						var attack_proc = ((Math.random() * unit_constants[origin].stamina_max) / unit_constants[origin].stamina_max) * 100;					

						if (attack_proc <= attack_chance) { var action = "attack" } else { var action = "cast" };
					} else {
						var action = "cast"
					}	
				} else {
					var action = "skip"
				};		

				current.action = action;
				current.force = unit_constants[origin].force + buff_effects[origin].force_add;
				current.poise = unit_constants[target].poise;

				current.evaluated = true;	

				turns_actions["action_" + action](turn, unit_constants, combat, index, buff_effects);
			}

			index++
			if (index < turn.sequence.length - 3) { evaluate_sequence(index) } else {
				game.turn_data = turn.sequence;
				game.markModified("turn_data");
				game.save(function(){
					callback(turn.sequence);
				})
			};
		};

		calculate_turns();
	})
}



module.exports = function(data){PRM = data; return SELF}