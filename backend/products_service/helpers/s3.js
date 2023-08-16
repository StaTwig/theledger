const { Upload } = require("@aws-sdk/lib-storage");
const { S3, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { getImageURL, setImageURL } = require("../middlewares/rbac_middleware");
const sharp = require("sharp");
const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const expiryLimit = process.env.AWS_EXPIRY_LIMIT || 7200;

const s3 = new S3({
  region
});

// uploads a file to s3
exports.uploadFile = async (file) => {
  if (file.mimetype == "image/png") {
    const image = await sharp(file.path)
      .rotate()
      .jpeg({ quality: 60, force: true })
      .toBuffer();
    const uploadParams = {
      Bucket: bucketName,
      Body: image,
      Key: file.filename,
    };
    return new Upload({
      client: s3,
      params: uploadParams
    }).done();
  } else {
    const image = await sharp(file.path)
      .jpeg({ quality: 60, force: true })
      .toBuffer();
    const uploadParams = {
      Bucket: bucketName,
      Body: image,
      Key: file.filename,
    };
    return new Upload({
      client: s3,
      params: uploadParams
    }).done();
  }
};

// downloads a file from s3
exports.getFileStream = (fileKey) => {
  const downloadParams = {
    Key: fileKey,
    Bucket: bucketName,
  };
  return s3.getObject(downloadParams).createReadStream();
};

function encode(data) {
  let buf = Buffer.from(data);
  let base64 = buf.toString("base64");
  return base64;
}

async function getFileBinary(fileKey) {
  const downloadParams = {
    Key: fileKey,
    Bucket: bucketName,
  };
  return s3.getObject(downloadParams);
}

exports.getFile = async (fileKey) => {
  const data = await getFileBinary(fileKey);
  return encode(data.Body);
};

exports.getSignedUrl = async (fileKey) => {
  const cachedURL = await getImageURL(fileKey);
  if (cachedURL) {
    return cachedURL;
  } else {
    const downloadParams = {
      Bucket: bucketName,
      Key: fileKey
    };
    const command = new GetObjectCommand(downloadParams);
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: expiryLimit })
    if (signedUrl) {
      await setImageURL(fileKey, signedUrl);
      return signedUrl;
    } else {
      return null;
    }
  }
};
