module.exports = async function runEveryday(bot, db, util) {
  const today = new Date();
  const users = await db.getAllUsers();
  users.forEach(async (user) => {
    const tasks = await db.getTasksOfDate(user.id, today);
    const tasksToRemind = tasks ? tasks.filter(task => {
      const taskDate = new Date(task.date);
      return util.compareYear(taskDate, today) || util.compareYear(taskDate, new Date("1-1-2000"));
    }) : null;

    if (!tasksToRemind)
      return;
    tasksToRemind.forEach(task => {
      const message = util.populateTaskMessage(task);
      bot.sendMessage(user.id, message, { parseMode: 'Markdown' });
    });
  });
}