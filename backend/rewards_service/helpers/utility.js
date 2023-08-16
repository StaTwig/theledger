exports.randomNumber = function (length) {
  let text = "";
  const possible = "123456789";
  for (let i = 0; i < length; i++) {
    const sup = Math.floor(Math.random() * possible.length);
    text += i > 0 && sup == i ? "0" : possible.charAt(sup);
  }
  return Number(text);
};

exports.asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

exports.getDateStringForMongo = function (date) {
  if (!date) return;
  const currDate = new Date(date);
  const year = currDate.getFullYear();
  const month = currDate.getMonth() + 1;
  const day = currDate.getDate();
  const dateString = `${year}${month < 10 ? "0" + month : month}${day < 10 ? "0" + day : day}`;
  return dateString;
};