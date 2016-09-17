module.exports = function() {
	var that = this;
	var Schema = this.mongoose.Schema;

	var rooms = new Schema({
		status: String,
		user_num: Number,
		date_time: String,
		user_data: Array,
		turn_data: Array
	});

	rooms.methods.generate = function(data, func){
		this.user_num = 1;
		this.date_time = new Date().getTime();
		this.user_data = [];
		this.turn_data = [];
		this.status = "waiting";

		this.save(func);
	};

	return rooms;
}