module.exports = class Task{
  subject; 
  day; 
  ofUser;
  constructor(subject, day, ofUser){
    this.subject = subject;
    this.day = day;
    this.ofUser = ofUser;
  };
  getMonth() {
    return this.day.split(delim)[1] || "*";
  };
  getDay() {
    return this.day.split(delim)[0];
  };
}