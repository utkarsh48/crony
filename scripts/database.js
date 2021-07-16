const { firebaseServiceJSON: stringConfig } = process.env;
const firebaseConfig = JSON.parse(stringConfig);

const admin = require("firebase-admin");
admin.initializeApp({
	  credential: admin.credential.cert(firebaseConfig)
	});
const db = admin.firestore();

const Task = require("./Task");


async function getAllUsers () {
	let snapshot = await db.collection("users").get();
	if(!snapshot.empty){
		let users = new Array();

		snapshot.forEach(doc => {
			users.push(doc.data());
		});

		return users;
	}
}

async function addUser (user) {
	try {
		await db.collection("users").doc(String(user.id)).set(user, { merge: true });
		return true;
	}
	catch (ex) {
		console.error(ex);
		return false;
	}
}

async function isUser (userId) {
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
}

async function getTasks (userId) {
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
}

async function addTask (userId, task) {
	try {
		const oldTasks = await getTasks(userId);
		const taskDay = task.getDate();
		
		const taskObject = {...task};
		taskObject.date = String(task.date);

		const oldTasksOfThisMonthExist = oldTasks? oldTasks.findIndex(oldTask => String(task.getMonth()) in oldTask) !== -1 : null;

		let obj = oldTasksOfThisMonthExist ?
			{ [taskDay]: admin.firestore.FieldValue.arrayUnion(taskObject) } :
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
}

async function deleteTask (userId, taskNo, date) {
	try {
		const tasksOfDay = await getTasksOfDate(userId, date);
		const taskToDelete = Task.fromFirebase(tasksOfDay[taskNo]);

		if (!taskToDelete || taskToDelete.date.getFullYear() !== date.getFullYear()) return null;

		const taskDay = date.getDate();
		let obj = { [taskDay]: admin.firestore.FieldValue.arrayRemove(tasksOfDay[taskNo]) };
		await db.collection("users").doc(String(userId)).collection("tasks").doc(String(taskToDelete.getMonth())).update(obj);
		return taskToDelete;
	}
	catch (ex) {
		console.error(ex);
		return null;
	}
}

async function updateTask (userId, rawChangedTask, taskNo, date) {
	try {
		const oldTasks = await getTasks(userId);
		const oldMonth = String(date.getMonth() + 1);
		const oldTasksOfThisMonth = oldTasks ? oldTasks.filter(task => oldMonth in task)[0][oldMonth] : null ;
		let taskDay = date.getDate();

		const taskToDelete = oldTasksOfThisMonth && oldTasksOfThisMonth[taskDay][taskNo] ? Task.fromFirebase(oldTasksOfThisMonth[taskDay][taskNo]) : null;

		if(!taskToDelete)
			throw new Error("Not found");

		const batch = db.batch();
		// remove

		if (!taskToDelete || taskToDelete.date.getFullYear() !== date.getFullYear()) return null;

		let toUpdateTask = { [taskDay]: admin.firestore.FieldValue.arrayRemove(taskToDelete.getTaskObject()) };
		const delDocRef = db.collection("users").doc(String(userId)).collection("tasks").doc(String(taskToDelete.getMonth()));

		batch.update(delDocRef, toUpdateTask);

		let changedTask = Task.fromFirebase({...taskToDelete, ...rawChangedTask});
		// add

		taskDay = changedTask.getDate();

		const taskObject = changedTask.getTaskObject();


		const updateDocRef = db.collection("users").doc(String(userId)).collection("tasks").doc(String(changedTask.getMonth()));
		if (oldTasksOfThisMonth){
			const toUpdateTask = { [taskDay]: admin.firestore.FieldValue.arrayUnion(taskObject) };
			batch.update(updateDocRef, toUpdateTask);
		}
		else{
			const toUpdateTask = { [taskDay]: [taskObject] };
			batch.set(updateDocRef, toUpdateTask, { merge: true });
		}

		await batch.commit();
		return true;
	}
	catch (ex) {
		console.error(ex);
		return false;
	}
}

async function getTasksOfDate (userId, date) {
	let snapshot = await db.collection("users")
		.doc(String(userId))
		.collection("tasks")
		.doc(String(date.getMonth() + 1)).get();

	return snapshot.exists ? snapshot.data()[String(date.getDate())] : null;
}


module.exports = {
	getAllUsers,
	addUser,
	isUser,
	getTasks,
	addTask,
	deleteTask,
	updateTask,
	getTasksOfDate
}