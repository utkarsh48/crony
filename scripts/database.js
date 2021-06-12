const { firebaseConfig } = require("../config.json");//process.env.BOT_TOKEN

const firebase = require("firebase/app");
require("firebase/firestore");
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const Task = require("./Task");


module.exports = {
  addUser: async function (user) {
    try {
      await db.collection("users").doc(String(user.id)).set(user, { merge: true });
      return true;
    }
    catch (ex) {
      console.error(ex);
      return false;
    }
  },
  isUser: async function (userId) {
    try {
      let doc = await db.collection("users").doc(String(userId)).get();
      if (doc.exists)
        return true;
      else
        return false;
    }
    catch (ex) {
      console.error(ex);
      return false;
    }
  },
  getTasks: async function (userId) {
    try {
      let snapshot = await db.collection("users")
        .doc(String(userId))
        .collection("tasks").get();

      if (snapshot.empty) {
        return null;
      }

      let tasks = new Array();

      snapshot.forEach(doc => {
        tasks.push({ [doc.id]: doc.data() });
      });

      return tasks;
    }
    catch (ex) {
      console.error(ex);
      return null;
    }
  },
  addTask: async function (userId, task) {
    try {
      const oldTasks = await this.getTasks(userId);
      const taskDay = task.getDate();
      
      const taskObject = {...task};
      taskObject.date = String(task.date);

      const oldTasksOfThisMonthExist = oldTasks? oldTasks.findIndex(oldTask => String(task.getMonth()) in oldTask) !== -1 : null;

      let obj = oldTasksOfThisMonthExist ?
        { [taskDay]: firebase.firestore.FieldValue.arrayUnion(taskObject) } :
        { [taskDay]: [taskObject] };


      if (oldTasksOfThisMonthExist)
        await db.collection("users").doc(String(userId)).collection("tasks").doc(String(task.getMonth())).update(obj);
      else
        await db.collection("users").doc(String(userId)).collection("tasks").doc(String(task.getMonth())).set(obj, { merge: true });

      return true;
    }
    catch (ex) {
      console.error(ex);
      return false;
    }
  },
  deleteTask: async function (userId, taskNo, date) {
    try {
      const tasksOfDay = await this.getTasksOfDate(userId, date);
      const taskToDelete = Task.fromFirebase(tasksOfDay[taskNo]);

      if (!taskToDelete || taskToDelete.date.getFullYear() !== date.getFullYear()) return null;

      const taskDay = date.getDate();
      let obj = { [taskDay]: firebase.firestore.FieldValue.arrayRemove(tasksOfDay[taskNo]) };
      await db.collection("users").doc(String(userId)).collection("tasks").doc(String(taskToDelete.getMonth())).update(obj);
      return taskToDelete;
    }
    catch (ex) {
      console.error(ex);
      return null;
    }
  },
  updateTask: async function (userId, rawChangedTask, taskNo, date) {
    try {
      return db.runTransaction(async ()=>{
        const res1 = await this.deleteTask(userId, taskNo, date);
        if(!res1) return false;
        
        let changedTask = Task.fromFirebase({...res1, ...rawChangedTask});
        const res2 = await this.addTask(userId, changedTask);
        return res1 && res2;
      });      
    }
    catch (ex) {
      console.error(ex);
      return false;
    }
  },
  getTasksOfDate: async (userId, date) => {
    let snapshot = await db.collection("users")
      .doc(String(userId))
      .collection("tasks")
      .doc(String(date.getMonth() + 1)).get();

    return snapshot.exists ? snapshot.data()[String(date.getDate())] : null;
  }
}
