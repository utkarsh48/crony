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


bot.on(['/start', '/begin'], async msg => {
  const user = {...msg.from}
  const res = await db.addUser(user);
  if(res)
    msg.reply.text(`Welcome! ${user.first_name}`);
});


bot.on(["/add", "/remind"], msg=> {
  return bot.sendMessage(msg.from.id, `Enter your task in the format: \nTask Name\nDD${delim}MM${delim}YYYY\n\skip ${delim}YYYY if its a yearly recurring, or ${delim}MM${delim}YYYY if its a mothly recurring tasks`, {ask: "task"});
});


bot.on("ask.task", msg=>{
  const [subject, day] = msg.text.split('/n');
  if(validateSubject(subject) && validateDay(day))
    return bot.sendMessage(msg.from.id, `Wrong format`, {ask: "task"});
  
  const task = new Task(subject, day, msg.from.id);

  db.addTask(task);
});


bot.start();




app.listen(process.env.PORT || 3000, () => console.log("listening..."));




function dash () {
  console.log("\n----------------------\n");
}

function validateSubject(subject){
  return subject.length>0
}

function validateDay(day){
  return day.split(delim).some(unit => isNaN(parseInt(unit)));
}