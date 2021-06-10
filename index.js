const TeleBot = require('telebot');
const app = require("express")();

const { token } = require("./config.json");
const bot = new TeleBot({
  token,
  usePlugins: ['askUser']
});

const validate = require("./scripts/validation");
const util = require("./scripts/utility");
const db = require("./scripts/database");
const delim = "-";


bot.on(['/start', '/begin'], async msg => {
  const user = { ...msg.from }
  const res = await db.addUser(user);
  if (res)
    msg.reply.text(`Welcome! ${user.first_name}`);
});


bot.on(["/add", "/remind"], async msg => {
  const { id } = msg.from;
  const userExist = await db.isUser(id);
  if (!userExist) return bot.sendMessage(id, "please /start the bot");


  return bot.sendMessage(id, `Enter your task in the format: \nDD${delim}MM${delim}YYYY\nReminder Name\nDescription\n\nskip ${delim}YYYY if its a yearly recurring`, { ask: "task_add" });
});

bot.on("ask.task_add", async msg => {
  const { id } = msg.from;

  const task = util.extractTask(msg.text);

  if (validate.subject(task.subject) && validate.day(task.date))
    return bot.sendMessage(id, `Wrong format`, { ask: "task_add" });

  let result;

  try {
    result = await db.addTask(id, task) ? "done" : "unable to add task";
  } catch (ex) {
    console.log(ex);
  }

  return bot.sendMessage(id, "add: " + result);
});


bot.on(["/delete", "/remove"], async msg => {
  const { id } = msg.from;
  const userExist = await db.isUser(id);
  if (!userExist) return bot.sendMessage(id, "please /start the bot");

  return getList(msg, "To delete a reminder send\nDD-MM-YYYY:ReminderNumber", { ask: "task_delete" });
});

bot.on("ask.task_delete", async msg => {
  const { id } = msg.from;

  const [day, taskNo] = util.extractDeleteString(msg.text);
  const date = new Date(util.swapMonthDate(day));

  if(!(day && date && taskNo))
    return bot.sendMessage(id, "Wrong format");

  let result;

  try {
    result = await db.deleteTask(id, taskNo - 1, date) ? "done" : "task not found";
  } catch (ex) {
    console.log(ex);
  }

  return bot.sendMessage(id, "delete: " + result);
});


bot.on(["/list", "/get"], async msg => {
  
  getList(msg, "Your reminders are as follows");
});

bot.start();
app.listen(process.env.PORT || 3000, () => console.log("listening..."));


getList = async (msg, firstLine, options) => {
  const { id } = msg.from;
  const userExist = await db.isUser(id);
  if (!userExist) return bot.sendMessage(id, "please /start the bot");
  let message = "";
  try {
    let res = await db.getTasks(id);
    message = util.populateTaskMessage(res, firstLine);
  } catch (ex) {
    console.log(ex);
  }
  
  return bot.sendMessage(id, message, { parseMode: 'Markdown', ...options});
}