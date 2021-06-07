const { firebaseConfig } = require("./config.json");//process.env.BOT_TOKEN

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
  getTasks: async function(userId){
    try {
      let snapshot = await db.collection("users")
        .doc(String(userId))
        .collection("tasks").get();

      if (snapshot.empty) {
        console.log("empty");
        return false;
      }

      let tasks = new Array();

      snapshot.forEach(doc=>{
        tasks.push({[doc.id]: doc.data()});
      });

      return tasks;
    }
    catch (ex) {
      console.error(ex);
      return null;
    }
  },
  //check again addTask if else properdestructuring?
  addTask: async function (task, userId) {
    try {
      const oldTasks = await this.getTasks(userId);
      const oldTasksOfThisMonthExist = oldTasks.findIndex(oldTask=>String(task.getMonth()) in oldTask) !== -1;
      
      const taskDay = task.getDate();
      const obj = oldTasksOfThisMonthExist ? 
        {[taskDay]: firebase.firestore.FieldValue.arrayUnion({...task})} : 
        {[taskDay]: [{...task}]};

      obj[taskDay].day = firebase.firestore.Timestamp.fromDate(task.day);

      if(oldTasksOfThisMonthExist)
        await db.doc(`/users/${userId}/tasks/${task.getMonth()}`).update(obj);
      else
        await db.doc(`/users/${userId}/tasks/${task.getMonth()}`).set(obj, {merge: true});

      return true;
    }
    catch (ex) {
      console.error(ex);
      return false;
    }
  },
  deleteTask: async function (task, userId) {
    try {
      const res = await this.getTask(task);
      const doc = res[String(userId)];
      if (!doc || !Task.match(doc, task))
        return false;

      await db.collection(Task.getMonth(task)).doc(Task.getDate(task)).update({
        [userId]: firebase.firestore.FieldValue.delete()
      });
      return true;
    }
    catch (ex) {
      console.error(ex);
      return false;
    }
  },
  getTask: async function (task) {
    try {
      let doc = await db.collection(Task.getMonth(task)).doc(Task.getDate(task)).get();
      if (doc.exists)
        return doc.data();
      else
        return null;
    }
    catch (ex) {
      console.error(ex);
      return false;
    }
  }
}
