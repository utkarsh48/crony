const Task = require("./Task");
const validate = require("./validation");


module.exports = {
  extractTaskFromString(str, options={suppress: false}){
    let [date, subject, ...descriptionParts] = str.split('\n');
    
    let description = descriptionParts.length >= 1 ? descriptionParts.join("\n") : "";
    let day = new Date(this.swapMonthDate(date));

    if(!options.suppress)
      if(!validate.dateString(date) || !validate.day(day))
        throw new Error("Wrong format");
    
    
    [subject, description] = [subject, description].map(text => text.trim());
    return new Task(subject, day, description);
  },

  extractModificationString: function (str) {
    return str.split(":");
  },

  populateListMessage: function (arr, firstLine = "Your reminders are as follows") {
    let message = firstLine + "\n";
    if (arr.length < 1) return "You have no reminders"

    //add other paths logic
    for (const doc of arr)
      for (const [monthNo, monthObj] of Object.entries(doc)) {
        message += `\n${this.getMonthName(monthNo)}\n----------\n`;
        for (const [date, dateObj] of Object.entries(monthObj)) {
          for (const [taskNo, task] of Object.entries(dateObj)) {
            message += this.populateTaskMessage(task, taskNo);
          }
        }
      }
    return message;
  },

  populateTaskMessage: function (task, taskNo = null) {
    let taskObject = Task.fromFirebase(task);

    if(!taskNo)
      return `${this.simplifyDate(taskObject.date)}\n*${taskObject.subject}*\n${taskObject.description ? taskObject.description : ""}\n-----\n\n`;

    return `Reminder ${parseInt(taskNo) + 1} of\n${this.simplifyDate(taskObject.date)}\n*${taskObject.subject}*\n${taskObject.description ? taskObject.description : ""}\n-----\n\n`;
  },

  getMonthName: function (num) {
    return ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][num - 1];
  },

  simplifyDate: function (date) {
    let str = `${this.padZero(date.getMonth() + 1)}-${this.padZero(date.getDate())}`;
    let whatYear = date.getFullYear();
    str = whatYear ? `${str}-${whatYear}` : str;
    return this.swapMonthDate(str);
  },

  padZero: function (num) {
    if (typeof num === "string" && num.length < 2)
      return "0" + num;
    else if (typeof num === "number" && num % 10 === num)
      return "0" + num;
    return num;
  },

  swapMonthDate: function (date) {
    let temp = date.split("-");
    [temp[0],temp[1]] = [temp[1],temp[0]];
    return temp.join("-");
  },

  compareYear: function (obj1, obj2) {
    return obj1.getFullYear() === obj2.getFullYear();
  }
};