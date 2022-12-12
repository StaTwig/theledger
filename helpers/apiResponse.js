// exports.successResponse = function (req, res, msg) {
//   const data = {
//     success: true,
//     message: req.t(msg),
//   };
//   return res.status(200).json(data);
// };

// exports.successResponseWithData = function (req, res, msg, data) {
//   const resData = {
//     success: true,
//     message: req.t(msg),
//     data: data,
//   };
//   return res.status(200).json(resData);
// };

exports.ErrorResponse = function (req, res, msg, code, data) {
  {
  const resdata = {
    success: false,
    message: req.t(msg),
  }

    if (data !== undefined){
      let errorObject = {};
      data.forEach((error) => (errorObject[error.param] = req.t(error.msg)));
      const resdata = {
        success: false,
        message: req.t(msg),
        data: errorObject,
    
      }};
   
  
  return res.status(code).json(resdata);
  };



  let errorObject = {};
  data.forEach((error) => (errorObject[error.param] = req.t(error.msg)));
  const resData = {
    success: false,
    message: req.t(msg),
    data: errorObject,

  };
  return res.status(400).json(resData)

  // return res.status(code).json(data);
};

// exports.notFoundResponse = function (req, res, msg) {
//   const data = {
//     success: false,
//     message: req.t(msg),
//   };
//   return res.status(404).json(data);
// };

// exports.validationErrorWithData = function (req, res, msg, data) {
//   let errorObject = {};
//   data.forEach((error) => (errorObject[error.param] = req.t(error.msg)));
//   const resData = {
//     success: false,
//     message: req.t(msg),
//     data: errorObject,
//   };
//   return res.status(400).json(resData);
// };

// exports.unauthorizedResponse = function (req, res, msg) {
//   const data = {
//     success: false,
//     message: req.t(msg),
//   };
//   return res.status(401).json(data);
// };

// exports.forbiddenResponse = function (req, res, msg) {
//   const data = {
//     success: false,
//     message: req.t(msg),
//   };
//   return res.status(403).json(data);
// };
