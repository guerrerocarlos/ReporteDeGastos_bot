const AWS = require("aws-sdk");
AWS.config.apiVersions = {
  s3: "2006-03-01",
};
let S3 = new AWS.S3({ region: process.env.AWS_REGION || "eu-west-3" });

function upload(Bucket, Key, Body) {
  Body = JSON.stringify(Body, null, 2);

  if (!Key.endsWith(".json")) {
    Key = `${Key}.json`;
  }

  var params = {
    Bucket,
    Key: Key.toLowerCase(),
    Body,
    // ACL: "public-read"
  };
  console.log("🟠 UPLOAD", params);
  return S3.upload(params).promise();
}

async function download(Bucket, Key) {
  try {
    if (!Key.endsWith(".json")) {
      Key = `${Key}.json`;
    }

    var params = { Bucket, Key: Key.toLowerCase() };
    console.log("💧 DOWNLOAD", params);
    return await S3.getObject(params).promise();
  } catch (err) {
    console.log("⭕️ EMPTY... {}", params, err);
    return null;
  }
}

function put(bucket, prefix, fileName, content) {
  return upload(bucket, prefix + fileName, content);
}

async function get(bucket, prefix, fileName) {
  try {
    let result = await download(bucket, prefix + fileName);

    if (result === null) {
      console.log("GOT NULL");
      return null;
    }

    if (result && result.Body) {
      try {
        return JSON.parse(result.Body.toString());
      } catch (err) {
        console.log("Err", err);
        return result.Body.toString();
      }
    } else {
      console.log("RETURN:", result);
      return result;
    }
  } catch (err) {
    console.log("GET ERROR:".err);
    return null;
  }
}

async function ls(Bucket, KeyPrefix, params) {
  params.Delimiter = "/"
  params.Bucket = Bucket;
  params.Prefix = KeyPrefix + params.Prefix;
  params.Prefix = params.Prefix.toLowerCase();

  console.log("listObjectsV2::finalParams", params);
  let results = await S3.listObjectsV2(params).promise();
  console.log("listObjectsV2::results", results)
  return results
}

module.exports = {
  get,
  put,
  ls
}