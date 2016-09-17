module.exports = function(){var SELF = {}
	SELF.action_attack = function(turn, unit_constants, combat, index, buff_effects){
		var current = turn.sequence[index];
		var next = turn.sequence[index + 1];

		var origin = current.origin;
		var target = current.target;

		var damage_total = (unit_constants[origin].damage * buff_effects[origin].health_dmg_multiply * buff_effects[target].reduce_dmg_divide) + (buff_effects[origin].health_dmg_add + buff_effects[target].reduce_dmg_subtract);

		if (current.unit_stats[target].block > 0) {
			var damage_health_factor = 0;
			var damage_defense_factor = 1;
			var push_resist = 2;
			var defense_spill_factor = 1
			next.unit_stats[target].block--;
		} else {
			var damage_health_factor = 0.5;
			var damage_defense_factor = 0.5;
			var push_resist = 1;
			var defense_spill_factor = 1.25
		}

		if (Math.round(damage_total * damage_defense_factor) >= current.unit_stats[target].defense) {
			current.damage.target.defense = current.unit_stats[target].defense;
			var damage_defense_spill = Math.round(damage_total * damage_defense_factor) - current.damage.target.defense;
		} else {
			current.damage.target.defense = Math.round(damage_total * damage_defense_factor);
			var damage_defense_spill = 0;
		}

		current.damage.target.defense *= buff_effects[origin].defense_dmg_multiply;
		current.damage.target.defense += buff_effects[origin].defense_dmg_add;
		if (Math.round(current.damage.target.defense) >= current.unit_stats[target].defense) { current.damage.target.defense = current.unit_stats[target].defense }

		current.damage.target.health = Math.round((damage_total * damage_health_factor) + damage_defense_spill);

		if (current.unit_stats[target].stamina > 0) {
			current.damage.target.stamina = (current.unit_stats[target].stamina - (current.unit_stats[target].stamina / buff_effects[origin].stamina_dmg_multiply)) + buff_effects[origin].stamina_dmg_add;
		} else {
			current.damage.target.stamina = buff_effects[origin].stamina_dmg_add;
		}

		if (current.unit_stats[target].stamina - current.damage.target.stamina <= 0){current.damage.target.stamina *= 0.5};

		if (current.unit_stats[origin].locX > current.unit_stats[target].locX) { var push_direction = -1 } else { var push_direction = 1 };

		var total_push = (Math.round(((unit_constants[origin].force + buff_effects[origin].force_add) / unit_constants[target].poise) * combat.flinch_push_duration) * push_direction * combat.flinch_push_movement) + (push_direction * combat.flinch_push_movement * combat.flinch_push_base);
		total_push /= push_resist;

		if (next.unit_stats[target].locX + total_push <= combat.margin) {
			var knockback_damage = combat.margin - (next.unit_stats[target].locX + total_push);
			next.unit_stats[target].locX = combat.margin;
		} else if (next.unit_stats[target].locX + total_push >= combat.world_width - combat.margin) {
			var knockback_damage = (next.unit_stats[target].locX + total_push) - (combat.world_width - combat.margin);
			next.unit_stats[target].locX = combat.world_width - combat.margin;
		} else {
			var knockback_damage = 0;
			next.unit_stats[target].locX += total_push;
		}

		current.damage.target.health += knockback_damage * combat.knockback_damage_factor;

		if (damage_defense_spill > 0){current.damage.target.health *= defense_spill_factor};

		if (Math.abs(current.unit_stats[origin].locX - current.unit_stats[target].locX) > combat.attack_distance) {
			current.unit_stats[origin].locX = current.unit_stats[target].locX + push_direction * -1 * combat.attack_distance;
			next.unit_stats[origin].locX = current.unit_stats[origin].locX;
		}

		current.damage.target.health = Math.round(current.damage.target.health);
		current.damage.target.stamina = Math.round(current.damage.target.stamina);
		current.damage.target.defense = Math.round(current.damage.target.defense);

		next.unit_stats[target].health -= current.damage.target.health;
		next.unit_stats[target].stamina -= current.damage.target.stamina;
		next.unit_stats[target].defense -= current.damage.target.defense;

		current.damage.origin.health = Math.round(buff_effects[target].health_dmg_reflect_add);
		current.damage.origin.defense = Math.round(buff_effects[target].defense_dmg_reflect_add);		
		if (next.unit_stats[origin].defense - current.damage.origin.defense <= 0){current.damage.origin.defense = next.unit_stats[origin].defense};

		current.damage.origin.leech_health = Math.round(buff_effects[origin].lifesteal_add);

		if (next.unit_stats[origin].health + current.damage.origin.leech_health >= unit_constants[origin].health_max){
			next.unit_stats[origin].health = unit_constants[origin].health_max;
		} else {
			next.unit_stats[origin].health += current.damage.origin.leech_health;
		}

		next.unit_stats[origin].health -= current.damage.origin.health;
		next.unit_stats[origin].defense -= current.damage.origin.defense;
		next.unit_stats[origin].stamina -= unit_constants[origin].stamina_cost;

		if (buff_effects[origin].stun_add > 0){
			next.unit_stats[target].debuffs.push({
				alias: "stun",
				factor: 0,
				duration: buff_effects[origin].stun_add
			})
		};
	}

	SELF.action_cast = function(turn, unit_constants, combat, index){
		var current = turn.sequence[index];
		var next = turn.sequence[index + 1];

		var origin = current.origin;
		var target = current.target;
		
		next.unit_stats[origin].staminaregen.push(combat.stamina_regen_duration)

		if (next.unit_stats[origin].block + 1 >= combat.blocks_max) {
			next.unit_stats[origin].block = combat.blocks_max;
		} else {
			next.unit_stats[origin].block++;
		}

		if (current.unit_stats[origin].locX > current.unit_stats[target].locX) { var flee_direction = -1 } else { var flee_direction = 1 };
		var total_flee = flee_direction * combat.cast_repel_factor * (combat.cast_time_duration + combat.cast_channel_duration);

		if (next.unit_stats[target].locX + total_flee <= combat.margin) {
			next.unit_stats[target].locX = combat.margin
		} else if (next.unit_stats[target].locX + total_flee >= combat.world_width - combat.margin) {
			next.unit_stats[target].locX = combat.world_width - combat.margin
		} else {
			next.unit_stats[target].locX += total_flee;
		}
	}

	SELF.action_skip = function(turn, unit_constants, combat, index){

	
		
	}

	return SELF
}