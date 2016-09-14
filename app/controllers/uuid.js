var sha1 = require('sha1');

module.exports = function() {
	var characters = ["q","w","e","r","t","y","u","i","o","p","a","s","d","f","g","h","j","k","l","z","x","c","v","b","n","m","1","2","3","4","5","6","7","8","9","0"];
	var returnString = '';

	var randomCount = 0;
	var today = new Date;
	var todayString = sha1(String(today.getTime()));
	while(randomCount < 40){
		returnString += characters[Math.round(Math.random()*(characters.length - 1))];
		returnString += todayString.charAt(randomCount)
		randomCount++;
	}

	return returnString;
};