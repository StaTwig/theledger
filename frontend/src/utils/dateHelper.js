export const getLastDates = (dates, time) => {
  return dates.filter((dt) => {
    const date1 = new Date(dt);
    //if(new Date() < date1) return false;
    const timeStamp = Math.round(new Date().getTime() / 1000);
    const timeStampYesterday = timeStamp - time * 3600;
    const is24 = date1 >= new Date(timeStampYesterday * 1000).getTime();
    return is24;
  });
};

export const expiringIn = (dates, time) => {
  return dates.filter((dt) => {
    const date1 = new Date(dt.expiryDate);
    const timeStamp = Math.round(new Date().getTime() / 1000);
    const timeStampYesterday = timeStamp - time * 3600;
    const is24 = date1 >= new Date(timeStampYesterday * 1000).getTime();
    return is24;
  });
};

export const expired = (dates, time) => {
  return dates.filter((dt) => {
    const date1 = new Date(dt.expiryDate);
    const timeStamp = Math.round(new Date().getTime() / 1000);
    const timeStampYesterday = timeStamp - time * 3600;
    const is24 = date1 <= new Date(timeStampYesterday * 1000).getTime();
    return is24;
  });
};

export const Count = (data) => {
  let sum = 0;
  if (typeof data == "object") {
    data.forEach((expire) => {
      sum += parseFloat(expire.quantity);
    });
  }
  return sum;
};

export const formatDate = (date, format) => {
  if (date === "" || date == null) {
    return "N/A";
  }
  let d = new Date(date),
    month = "" + (d.getMonth() + 1),
    day = "" + d.getDate(),
    year = d.getFullYear();
  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;
  if (format === "mmyyyy") return [month, year].join("/");
  return [day, month, year].join("/");
};

export const formatTime = (d) => {
  const date = new Date(d);
  let hours = date.getHours();
  let minutes = date.getMinutes();
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  return hours + ":" + minutes + "" + ampm;
};

export const formatDateTime = (d) => {
  const strTime = formatDate(d) + "  " + formatTime(d) || "N/A";
  return strTime;
};

export const getDateStringForMongo = function (date) {
  if (!date) return;

  let currDate = new Date(date);
  let year = currDate.getFullYear();
  let month = currDate.getMonth() + 1;
  let day = currDate.getDate();
  let dateString = `${year}${month < 10 ? "0" + month : month}${day < 10 ? "0" + day : day}`;

  return dateString;
};