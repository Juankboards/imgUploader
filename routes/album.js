const express = require('express'),
	router = express.Router(),
	ObjectId = require('mongodb').ObjectID,
	{ addImgDb, delImgDb, getAlbum } = require('./../utils/dbFunctions'),
	{ addImgS3, delImgS3 } = require('./../utils/s3Functions')

router.get('/:id', async (req, res, next) => {
	let db = res.locals.client.db(process.env.IMG_DB_NAME)
	try {
		let id = ObjectId(req.params.id)
		let album = await getAlbum(db, id)
		res.locals.client.close()
		res.render('album', { user: req.user, album })
	} catch(error) {
		res.render('404')
	}
	
})

router.post('/:id/delete', function (req, res, next) {
	let db = res.locals.client.db(process.env.IMG_DB_NAME)
	let id = ObjectId(req.params.id)
	let img = req.body.img
	let imgS3Path = img.split(process.env.IMG_DB_SERVICE)[1]
	delImgS3(imgS3Path)
	.then(() => delImgDb(db, id, img))
	.then(() => {
		res.locals.client.close()
		res.status(200).json({ data: "Image deleted"})
	}).catch(err => {
		res.locals.client.close()
		res.status(400).json({ error: err })
	})	
})

router.post('/:id/add', async (req, res, next) => {
	let db = res.locals.client.db(process.env.IMG_DB_NAME)
	let id = ObjectId(req.params.id)
	let documentName = (await getAlbum(db, id))._id.toString()

	if(!documentName) {
		res.status(400).json({ error: 'Not album found' })
		return
	}
	
	let imgData = req.body.image
	let imgType = imgData.split(";")[0].split("/")[1]
	let randomId = Date.now() + "_" + Math.random().toString().split(".")[1]
	let imgName = req.user._id.toString() + "/" + documentName + "/img_" + randomId
	let result = { data: imgData, name: `${process.env.IMG_DB_SERVICE}${process.env.DB_NAME}/${imgName}` }
	try {
		let dbResult = await addImgDb(db, id, imgName)
		if(!dbResult.ok) throw new Error("Error storing image on DB")
		await addImgS3({ imgData, imgName, imgType })
		res.status(200).json({ data: result})
	} catch(e) {
		console.log(e);
		delImgDb(db, id, imgName)
		res.status(400).json({ data: result, error: e})
	}	
})

module.exports = router
