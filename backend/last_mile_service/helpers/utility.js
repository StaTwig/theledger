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

	let currDate = new Date(date);
	let year = currDate.getFullYear();
	let month = currDate.getMonth() + 1;
	let day = currDate.getDate();
	let dateString = `${year}${month < 9 ? "0" + month : month}${day < 9 ? "0" + day : day}`;

	return dateString;
};