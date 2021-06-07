const TeleBot = require('telebot');
const app = require("express")();

const { token } = require("./config.json");
const bot = new TeleBot({
  token,
  usePlugins: ['askUser']
});

const db = require("./database");
const Task = require("./Task");
const delim = "-";
const syntaxMessage = `Enter your task in the format: \nMM${delim}DD${delim}YYYY\nReminder Name\nDescription\n\nskip ${delim}YYYY if its a yearly recurring`;

bot.on(['/start', '/begin'], async msg => {
  const user = { ...msg.from }
  const res = await db.addUser(user);
  if (res)
    msg.reply.text(`Welcome! ${user.first_name}`);
});


bot.on(["/add", "/remind"], async msg => {
  const { id } = msg.from;
  const userExist = await db.isUser(id);
  if(!userExist) return bot.sendMessage(id, "please /start the bot");


  return bot.sendMessage(id, syntaxMessage, { ask: "task_add" });
});

bot.on("ask.task_add", async msg => {
  const { id } = msg.from;

  const task = extractTask(msg.text);

  if (validateSubject(task.subject) && validateDay(task.date))
    return bot.sendMessage(id, `Wrong format`, { ask: "task_add" });

  let result;

  try {
    result = await db.addTask(task, id)?"done":"unable to add task";
  } catch (ex) {
    console.log(ex);
  }

  return bot.sendMessage(id, "add: "+result);
});


bot.on(["/delete", "/remove"], async msg => {
  const { id } = msg.from;
  const userExist = await db.isUser(id);
  if(!userExist) return bot.sendMessage(id, "please /start the bot");


  return bot.sendMessage(id, syntaxMessage, { ask: "task_delete" });
});

bot.on("ask.task_delete", async msg => {
  const { id } = msg.from;

  const task = extractTask(msg.text);

  if (validateSubject(task.subject) && validateDay(task.date))
    return bot.sendMessage(id, `Wrong format`, { ask: "task_delete" });
  
  let result;

  try {
    result = await db.deleteTask(task, id)?"done":"task not found";
  } catch (ex) {
    console.log(ex);
  }

  return bot.sendMessage(id, "delete: "+result);
});


bot.on(["/list", "/get"], async msg => {
  const { id } = msg.from;
  const userExist = await db.isUser(id);
  if(!userExist) return bot.sendMessage(id, "please /start the bot");
  let message = "";
  try {
    let res = await db.getTasks(id);
    message = populateTaskMessage(res);
  } catch (ex) {
    console.log(ex);
  }
  return bot.sendMessage(id, message, { parseMode: 'Markdown' });
});

bot.start();
app.listen(process.env.PORT || 3000, () => console.log("listening..."));


function validateSubject(subject) {
  return subject.length > 0
}

function validateDay(day) {
  if( day.length <= 3 && 
  !day.some(unit => isNaN(parseInt(unit))) )

    if( ([0,1,3,5,7,8,10,12].indexOf(day[1]) !== -1) && 
    day[0] > 0 && 
    day[0] <= 31 )
      return true;
    else if( [4,6,9,11].indexOf(day[1]) !==- 1 && 
    day[0] > 0 && 
    day[0] <= 30 )
      return true;
    else if(day[1]===2 && 
    day[0] > 0 && 
    day[0] <=29 )
      return true;
  
  return false;
}


function extractTask(str){
  let [date, subject, ...descriptionParts] = str.split('\n');
  
  let description = descriptionParts.length >= 1 ? descriptionParts.join("\n") : "";
  let day = new Date(date);
  
  [subject, description] = [subject, description].map(text=>text.trim());
  return new Task(subject, day, description);
}

function populateTaskMessage(arr){
  let message = "Your reminders are as follows\n";
  if(arr.length<1) return "You have no reminders"
  
  //add other paths logic
  for(const doc of arr)
    for(const [monthNo, monthObj] of Object.entries(doc)){
      message += `\n${getMonthName(monthNo)}\n----------\n`;
      for(const [date, dateObj] of Object.entries(monthObj)){
        for(const [taskNo, task] of Object.entries(dateObj)) {
          let taskObject = Task.fromFirebase(task);
          message += `Reminder ${parseInt(taskNo)+1} of\n${simplifyDate(taskObject.date)}\n*${taskObject.subject}*\n${taskObject.description}\n-----\n\n`;
        }      
      }
    }
  return message;
}

function getMonthName(num){
  return ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][num-1];
}

function simplifyDate(date) {
  let str = `${padZero(date.getMonth()+1)}-${padZero(date.getDate())}`;
  let whatYear = date.getYear() % 100;
  return whatYear ? `${str}-${padZero(whatYear)}` : str;
}

function padZero(num){
  if(typeof num === "string" && num.length<2)
    return "0"+num;
  else if(typeof num === "number" && num%10===num)
    return "0"+num;
  return num;
}