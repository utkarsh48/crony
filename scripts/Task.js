module.exports = class Task{
  subject; 
  date;
  description;
  constructor(subject, day, description){
    this.subject = subject;
    this.date = day;
    this.description = description;
  };

  static fromFirebase(obj){
    let {subject, date, description} = obj;
    date = new Date(date);
    return new Task(subject, date, description);
  }

  getDate(){
    return this.date.getDate();
  }

  getMonth(){
    return this.date.getMonth()+1;
  }

  static duringInputDay(day) {
    let splitDay = day.split(delim);
    splitDay = splitDay.map(unit=>unit.trim());
  
    switch (splitDay.length) {
      case 2:
        splitDay.push("0");
        break;
      default:
        throw new Error("invalid date");
    }
  
    return splitDay.join("-");
  }
}