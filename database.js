const { firebaseConfig } = require("./config.json");//process.env.BOT_TOKEN
const delim = "-";
/////////////////
const firebase = require("firebase/app");
require("firebase/firestore");
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const Task = require("./Task");


module.exports = {
  addUser: async function (user) {
    try {
      await db.collection("users").doc(`${user.id}`).set(user, { merge: true });
      return true;
    }
    catch (ex) {
      console.error(ex);
      return false;
    }
  },
  isUser: async function (userId) {
    try {
      let doc = await db.collection("users").doc(`${userId}`).get();
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
  addTask: async function (task) {
    try {
      const obj = { [task.ofUser]: { subject: task.subject, ofUser: task.ofUser } };
      await db.collection(Task.getMonth(task)).doc(Task.getDay(task)).set(obj, { merge: true });
      return true;
    }
    catch (ex) {
      console.error(ex);
      return false;
    }
  },
  deleteTask: async function (task) {
    try {
      const res = await this.getTask(task);
      const doc = res[String(task.ofUser)];
      if (!doc || doc["subject"] !== task["subject"])
        return false;

      await db.collection(Task.getMonth(task)).doc(Task.getDay(task)).update({
        [task.ofUser]: firebase.firestore.FieldValue.delete()
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
      let doc = await db.collection(Task.getMonth(task)).doc(Task.getDay(task)).get();
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
