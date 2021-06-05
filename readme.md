to delete redundant ofUser from add task
bot.on(["/get", "/fetch"], msg => {
  const { id } = msg.from;

  return bot.sendMessage(id, `Enter your task in the format: \nTask Name\nDD${delim}MM${delim}YYYY\n\skip ${delim}YYYY if its a yearly recurring, or ${delim}MM${delim}YYYY if its a mothly recurring tasks`, { ask: "task_get" });
});

bot.on("ask.task_get", async msg => {
  const { id } = msg.from;

  const [subject, day ] = msg.text.split('\n');
  if (validateSubject(subject) && validateDay(day))
    return bot.sendMessage(id, `Wrong format`, { ask: "task_get" });

  const task = new Task(subject, day, id);
  
  let result;

  try {
    result = await db.getTask(task);
    if(result[id])
      result = `${result[id].subject}\n${}`
  } catch (ex) {
    console.log(ex);
  }
  result = result?result:"task doesn't exist";
  console.log(result[id]);
  return bot.sendMessage(id, "get: "+ result);
});