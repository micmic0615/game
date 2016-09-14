module.exports = function() {
	var that = this;
	var Schema = this.mongoose.Schema;

	var users = new Schema({
		name: String
	});

	users.methods.generate = function(data, func){
		this.name = data.name;
		
		this.save(func)
	};

	return users;
}