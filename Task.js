const delim = '-';
module.exports = class Task{
  subject; 
  day; 
  ofUser;
  constructor(subject, day, ofUser){
    this.subject = subject;
    this.day = day;
    this.ofUser = ofUser;
  };
  static getMonth(obj) {
    return obj.day.split(delim)[1] || "*";
  };
  static getDay(obj) {
    return obj.day.split(delim)[0];
  };
}