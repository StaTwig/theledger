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

exports.excludeExpireProduct = (data) => {
  let today = new Date();
  let year = today.getFullYear();
  let month = today.getMonth() + 1;
  let day = today.getDate();
	today = `${year}-${month < 10 ? "0" + month : month}-${day < 10 ? "0" + day : day}`;
	return data.filter((product) => {
		if (product?.manufacturingDate) {
			if (today < product.manufacturingDate) return false;
		}
		if (product?.expiryDate) {
			if (product?.manufacturingDate) {
				if (product.expiryDate < product.manufacturingDate) return false;
			}
			if (product.expiryDate < today) return false;
		}
		return true;
	});
};

exports.compareArrays = function (array1, array2) {
  if (!array1 || !array2) return false;

  if (array1.length !== array2.length) return false;

  array1.sort();
  array2.sort();

  for (let i = 0; i < array1.length; ++i) {
    if (array1[i] !== array2[i]) return false;
  }

  return true;
}

exports.getDateStringForMongo = function (date) {
	if (!date) return;

	let currDate = new Date(date);
	let year = currDate.getFullYear();
	let month = currDate.getMonth() + 1;
	let day = currDate.getDate();
	let dateString = `${year}${month < 10 ? "0" + month : month}${day < 10 ? "0" + day : day}`;

	return dateString;
};