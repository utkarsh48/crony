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
  let message = new String();

  try {
    const task = util.extractTaskFromString(msg.text);

    message = await db.addTask(id, task) ? "done" : "unable to add reminder";
  } catch (ex) {
    message = ex.message;
    console.log(ex);
  }

  return bot.sendMessage(id, "add: " + message);
});



bot.on(["/delete", "/remove"], async msg => {
  const { id } = msg.from;
  const userExist = await db.isUser(id);
  if (!userExist) return bot.sendMessage(id, "please /start the bot");

  return getList(msg, "To delete a reminder send\nDD-MM-YYYY:ReminderNumber", { ask: "task_delete" });
});

bot.on("ask.task_delete", async msg => {
  const { id } = msg.from;
  let result = new String();
  
  try {
    const [day, taskNo] = util.extractModificationString(msg.text);
    const date = new Date(util.swapMonthDate(day));
  
    if(taskNo || !validate.day(date))
      throw new Error("Wrong format");

    result = await db.deleteTask(id, taskNo - 1, date) ? "done" : "task not found";
  } catch (ex) {
    result = ex.message;
    console.log(ex);
  }

  return bot.sendMessage(id, "delete: " + result);
});



bot.on(["/list", "/get"], async msg => {
  getList(msg, "Your reminders are as follows");
});



bot.on(["/listOf", "/getOf"], async msg => {
  const { id } = msg.from;
  const userExist = await db.isUser(id);
  if (!userExist) return bot.sendMessage(id, "please /start the bot");

  bot.sendMessage(id, "Send a date in the format\nDD-MM-YYYY", {ask: "task_get_of"});
});

bot.on("ask.task_get_of", async msg => {
  const { id } = msg.from;
  let result = new String();
  try {
    const date = new Date(msg.text);
    if(!validate.day(date)) throw new Error("Wrong format");

    const tasks = await db.getTasksOfDate(id, date);
    if(!tasks)
      throw new Error("No reminders found");
    
    for(const [taskNo, task] of Object.entries(tasks))
      result += util.populateTaskMessage(taskNo, task);
    
  } catch (ex) {
    console.error(ex);
    result = ex.message;
  }
  return bot.sendMessage(id, result, { parseMode: 'Markdown'});
})



bot.on(["/update"], async msg => {
  const { id } = msg.from;

  return bot.sendMessage(id, "To update a reminder send\nDD-MM-YYYY:ReminderNumber\nDD-MM-YYYY\nSubject\nDescription", { ask: "task_update" });
});

bot.on("ask.task_update", async msg => {
  const { id } = msg.from;
  let result = new String();
  try {
    const [modificationPart, ...taskPart] = msg.text.split("\n");
    const [day, taskNo] = util.extractModificationString(modificationPart);
    const changedTask = util.extractTaskFromString(taskPart.join("\n"));
    const date = new Date(util.swapMonthDate(day));

    if (String(changedTask.date) === "Invalid Date")
      delete changedTask.date;
    if(!(day && date && taskNo && changedTask))
      throw new Error("Wrong format");
    
    result = await db.updateTask(id, changedTask, taskNo - 1, date) ? "done" : "task not found";
  } catch (ex) {
    result = ex.message;
    console.log(ex);
  }
  return bot.sendMessage(id, "update: " + result);
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
    message = util.populateListMessage(res, firstLine);
  } catch (ex) {
    console.log(ex);
  }
  
  return bot.sendMessage(id, message, { parseMode: 'Markdown', ...options});
}