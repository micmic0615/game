module.exports = function() {
	glob = require('glob');

	return function(path, callback){
		glob(path, function(err, files){
			for (var i = 0; i < files.length; ++i) {callback(files[i])}
		})
	};
};