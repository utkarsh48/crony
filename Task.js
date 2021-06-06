const delim = '-';
module.exports = class Task{
  subject; 
  day;
  year;
  description;
  constructor(subject, day, description){
    this.subject = subject;
    this.day = day;
    this.description = description;
    this.year = Task.getYear(this);
  };
  static getYear(obj) {
    return obj.day[2];
  };
  static getMonth(obj) {
    return obj.day[1];
  };
  static getDay(obj) {
    return obj.day[0];
  };
  static match(obj1, obj2){
    let flag = false;
    for(let prop in obj1){
      if( prop === "day" )
        continue;
      else if(obj1[prop] === obj2[prop])
        flag = true;
      else
        flag = false;
    }
    return flag;
  }
}