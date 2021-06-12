module.exports = {
  day : function(day) {
    let date = new Date(day)
    if(String(date) === "Invalid Date")
      return false;
    return true;
  },
  subject : function(subject) {
    return subject.length > 0;    
  }
}