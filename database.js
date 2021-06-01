const { firebaseConfig } = require("./config.json");//process.env.BOT_TOKEN
const delim = "-";
/////////////////
const firebase = require("firebase/app");
require("firebase/firestore");
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const Task = require("./Task");



module.exports={
  addUser : async function (user) {
    try {
      const doc = await db.collection("users").doc(`${user.id}`).set(user, {merge: true});
      return true;
    } 
    catch (ex) {
      console.error(ex);
      return false;
    }
  },
  addTask : async function (task) {
    try {
      const obj = {[task.ofUser]: {subject: task.subject, ofUser: task.ofUser} };
      const doc = await db.collection(Task.getMonth(task)).doc(Task.getDay(task)).set(obj, {merge: true});
      return true;
    } 
    catch (ex) {
      console.error(ex);
      return false;
    }
  }
}
