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
const syntaxMessage = `Enter your task in the format: \nTask Name\nDD${delim}MM${delim}YYYY\n\nskip ${delim}YYYY if its a yearly recurring, or ${delim}MM${delim}YYYY if its a mothly recurring tasks`;

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

  if (validateSubject(task.subject) && validateDay(task.day))
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

  if (validateSubject(task.subject) && validateDay(task.day))
    return bot.sendMessage(id, `Wrong format`, { ask: "task_add" });
  
  let result;

  try {
    result = await db.deleteTask(task, id)?"done":"task not found";
  } catch (ex) {
    console.log(ex);
  }

  return bot.sendMessage(id, "delete: "+result);
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

function convertDay(day) {
  let splitDay = day.split(delim);

  splitDay = splitDay.map(unit=>unit.trim());

  switch (splitDay.length) {
    case 2:
      splitDay.push("0");
      break;
    case 1:
      splitDay.push("0");
      splitDay.push("0");
      break;
  }

  return splitDay;
}

function extractTask(str){
  let [subject, day, ...descriptionParts] = str.split('\n');
  
  let description = descriptionParts.length >= 1 ? descriptionParts.join("\n") : "";
  day = convertDay(day);
  
  [subject, description] = [subject, description].map(text=>text.trim());
  return new Task(subject, day, description);
}