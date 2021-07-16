const Task = require("./Task");
const validate = require("./validation");


function isPrivate (msg) {
	return (msg && msg.chat.type === "private" && msg.chat.id === msg.from.id);
}

function makeItPrivate(msg){
	if (!isPrivate(msg))
		return msg.reply.text("Use this bot from private chat only.");
}

function extractTaskFromString(str, options={suppress: false}){
	try{
		if(!validate.taskFromString(str))
			throw new Error();
		let [day, subject, ...descriptionParts] = str.split('\n');
		
		if(!validate.subject(subject))
			throw new Error();
		
		let description = descriptionParts.length >= 1 ? descriptionParts.join("\n") : "";
		let date = new Date(swapMonthDate(day));

		if(!options.suppress)
			if(!validate.dateString(day) || !validate.day(date))
				throw new Error();
		
		setItYear2000(day, date);

		[subject, description] = [subject, description].map(text => text.trim());
		return new Task(subject, date, description);
	}catch(ex){
		throw new Error("Wrong Format");
	}
}

function extractModificationString (str) {
	try{
		return str.split(":");
	}catch(ex){
		throw new Error("Wrong Format");
	}
}

function populateListMessage (arr, firstLine = "Your reminders are as follows") {
	let message = "\n";
	if (arr.length < 1) return "You have no reminders"

	for (const doc of arr)
		for (const [monthNo, monthObj] of Object.entries(doc)) {
			let month = `\n*${getMonthName(monthNo)}*\n*----------*\n`;
			let tasks = new String();
			for (const [date, dateObj] of Object.entries(monthObj)) {
				for (const [taskNo, task] of Object.entries(dateObj)) {
					tasks += populateTaskMessage(task, taskNo);
				}
			}
			if(tasks.trim() !== "")
				message += month + tasks;
		}
	if(message.trim()==="")
		return "No reminders found";
	return firstLine + message;
}

function populateTaskMessage (task, taskNo = null) {
	let taskObject = Task.fromFirebase(task);

	if(!taskNo)
		return `${simplifyDate(taskObject.date)}\n*${taskObject.subject}*\n${taskObject.description ? taskObject.description : ""}\n-----\n\n`;

	return `${simplifyDate(taskObject.date)}:${parseInt(taskNo) + 1}\n*${taskObject.subject}*${taskObject.description ? "\n"+taskObject.description : ""}\n-----\n\n`;
}

function getMonthName (num) {
	return ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][num - 1];
}

function simplifyDate (date) {
	let str = `${padZero(date.getMonth() + 1)}-${padZero(date.getDate())}`;
	let whatYear = date.getFullYear();
	str = whatYear ? `${str}-${whatYear}` : str;
	return swapMonthDate(str);
}

function padZero (num) {
	if (typeof num === "string" && num.length < 2)
		return "0" + num;
	else if (typeof num === "number" && num % 10 === num)
		return "0" + num;
	return num;
}

function swapMonthDate (date) {
	let temp = date.split("-");
	[temp[0],temp[1]] = [temp[1],temp[0]];
	return temp.join("-");
}

function compareYear (obj1, obj2) {
	return obj1.getFullYear() === obj2.getFullYear();
}

function setItYear2000(stringDate, dateObj) {
	if (stringDate.split("-").length < 3)
		dateObj.setFullYear(2000);
}

module.exports = {
	makeItPrivate,
	extractTaskFromString,
	extractModificationString,
	populateListMessage,
	populateTaskMessage,
	getMonthName,
	swapMonthDate,
	compareYear,
	setItYear2000
}