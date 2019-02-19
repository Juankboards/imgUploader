const express = require('express'),
	router = express.Router(),
	aws = require('aws-sdk'),
	ObjectId = require('mongodb').ObjectID

aws.config.region = ""
aws.config.accessKeyId = ""
aws.config.secretAccessKey = ""
const s3 = new aws.S3()

function getAlbum(db, id) {
	return db.collection("folders").find({ "_id": id}).toArray()
		.then(items => {
			return items
		})
		.catch(err => {
			console.log(err)
			return []
		})
}


function delImgDb(db, id, img) {
	return db.collection("folders").updateOne({ "_id": id}, { $pull: { "photos": `https://s3.amazonaws.com/${img}` } })
}

function addImgDb(db, id, imgName) {
	return db.collection("folders").findOneAndUpdate({ "_id": id}, { $push: { "photos": `https://s3.amazonaws.com./czaudiovisual/${imgName}` } }, { returnOriginal: false })
}

function delImgS3(img) {
	const s3 = new aws.S3(),	
		imgInfo = img.split("/")

	return s3.deleteObject({
	  Bucket: imgInfo.shift(),
	  Key: imgInfo.join("/") 
	})
}

function addImgS3({ imgData, imgName, imgType }) {
	const imageBuffer = Buffer.from(imgData.split(",")[1], "base64")

	return s3.putObject({
	  Bucket: "czaudiovisual",
    Key: imgName,
    Body: imageBuffer,
    ContentEncoding: 'base64',
    ContentType: "image/" + imgType,
		ACL: 'public-read'
	}).promise()
}


router.get('/:id', function (req, res, next) {
	let db = res.locals.client.db('czaudiovisual')
	let id = ObjectId(req.params.id)

	getAlbum(db, id)
	.then(album => {
		res.locals.client.close()
		res.render('album', { album: album[0] })
	})
})

router.post('/:id/delete', function (req, res, next) {
	let db = res.locals.client.db('czaudiovisual')
	let id = ObjectId(req.params.id)
	let img = req.body.imgPath

	var deleteS3Request = delImgS3(img)
	deleteS3Request.send((err, data) => {
		if (err) 
			res.status(400).json({ message: err })

		delImgDb(db, id, img)
			.then(status => {
					res.locals.client.close()
					if (!status.result.nModified)
						res.status(400).json({ error: "Not found image" })
					res.status(200).json({ message: "Image deleted"})
				})
				.catch(err => {
					res.status(400).json({ error: err })
				})
			})
})

router.post('/:id/add', async function (req, res, next) {
	let db = res.locals.client.db('czaudiovisual')
	let id = ObjectId(req.params.id)
	let documentName = (await getAlbum(db, id))[0].name
	let imgs = req.body.imgsBatch
	let promises = []
	let added = []

	promises = imgs.map(async imgData => {
		let imgType = imgData.split(";")[0].split("/")[1],
			imgName = documentName + "/img_" + Date.now() + "_" + Math.random().toString().split(".")[1]
			
		try {
			let dbResult = await addImgDb(db, id, imgName)
			if(dbResult.ok) {
				return ({
					imgData,
					imgName,
					imgType
				})
			}
		} catch(e) {
			throw e
		}
	})

	let dbResults = await Promise.all(promises)
	let s3Results = await Promise.all(dbResults.map(img => addImgS3(img)))

	res.status(200).json({ data: s3Results})
})

module.exports = router
