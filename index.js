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

  let [subject, day ] = msg.text.split('\n');
  if (validateSubject(subject) && validateDay(day))
    return bot.sendMessage(id, `Wrong format`, { ask: "task_add" });
  day = convertDay(day);  

  const task = new Task(subject, day, id);

  let result;

  try {
    result = await db.addTask(task)?"done":"unable to add task";
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

  let [subject, day ] = msg.text.split('\n');
  if (validateSubject(subject) && validateDay(day))
    return bot.sendMessage(id, `Wrong format`, { ask: "task_delete" });
  day = convertDay(day);  

  const task = new Task(subject, day, id);
  
  let result;

  try {
    result = await db.deleteTask(task)?"done":"task not found";
  } catch (ex) {
    console.log(ex);
  }

  return bot.sendMessage(id, "delete: "+result);
});



bot.start();




app.listen(process.env.PORT || 3000, () => console.log("listening..."));




function dash() {
  console.log("\n----------------------\n");
}

function validateSubject(subject) {
  return subject.length > 0
}

function validateDay(day) {
  let splitDay = day.split(delim);
  if(splitDay.length <= 3)
    return splitDay.some(unit => isNaN(parseInt(unit)));
  return false;
}

function convertDay(day) {
  let splitDay = day.split(delim);

  switch (splitDay.length) {
    case 2:
      splitDay.push("*");
      break;
    case 1:
      splitDay.push("*");
      splitDay.push("*");
  }

  return splitDay.join(delim);
}