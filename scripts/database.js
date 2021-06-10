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
  //check again addTask if else properdestructuring?
  addTask: async function (userId, task) {
    try {
      const oldTasks = await this.getTasks(userId);
      const oldTasksOfThisMonthExist = oldTasks.findIndex(oldTask => String(task.getMonth()) in oldTask) !== -1;

      const taskDay = task.getDate();
      
      const taskObject = {...task};
      taskObject.date = String(task.date);
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
      const tasksOfDay = await this.getTasksOfDate(String(userId), date);
      const taskToDelete = Task.fromFirebase(tasksOfDay[taskNo]);

      if (!taskToDelete) return false;


      const taskDay = date.getDate();
      let obj = { [taskDay]: firebase.firestore.FieldValue.arrayRemove(tasksOfDay[taskNo]) };
      await db.collection("users").doc(String(userId)).collection("tasks").doc(String(taskToDelete.getMonth())).update(obj);
      return true;
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
