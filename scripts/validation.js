function day(day) {
	let date = new Date(day)
	if(String(date) === "Invalid Date")
		return false;
	return true;
}

function subject(subject) {
	return subject.length > 0;
}

function dateString (dateString) {
	return dateString.split("-").length >= 2;
}

function taskFromString (str) {
	return str.split('\n').length > 1;
}

module.exports = {
	day,
	subject,
	dateString,
	taskFromString
};