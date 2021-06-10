module.exports = {
  day : function(day) {
          if (day.length <= 3 &&
            !day.some(unit => isNaN(parseInt(unit))))
        
            if (([0, 1, 3, 5, 7, 8, 10, 12].indexOf(day[1]) !== -1) &&
              day[0] > 0 &&
              day[0] <= 31)
              return true;
            else if ([4, 6, 9, 11].indexOf(day[1]) !== - 1 &&
              day[0] > 0 &&
              day[0] <= 30)
              return true;
            else if (day[1] === 2 &&
              day[0] > 0 &&
              day[0] <= 29)
              return true;
        
          return false;
        },
  subject : function(subject) {
    return subject.length > 0;    
  }
}