const aws = require('aws-sdk')

if(!process.env.NODE_ENV) require('dotenv').config()

aws.config.region = process.env.S3_ZONE
aws.config.accessKeyId = process.env.S3_ACCESS_KEY
aws.config.secretAccessKey = process.env.S3_SECRET

const s3 = new aws.S3()

function addImgS3({ imgData, imgName, imgType }) {
	const imageBuffer = Buffer.from(imgData.split(",")[1], "base64")

	return s3.upload({
	  Bucket: "czaudiovisual",
    Key: imgName,
    Body: imageBuffer,
    ContentEncoding: 'base64',
    ContentType: "image/" + imgType,
		ACL: 'public-read'
	}).promise()
}

function delImgS3(img) {
	const s3 = new aws.S3(),	
		imgInfo = img.split("/")

	return s3.deleteObject({
	  Bucket: imgInfo.shift(),
	  Key: imgInfo.join("/") 
	}).promise()
}

module.exports = {
		addImgS3,
    delImgS3
}