const express = require('express'),
	router = express.Router(),
	ObjectId = require('mongodb').ObjectID,
	{ addImgDb, delImgDb, getAlbum } = require('./../utils/dbFunctions'),
	{ addImgS3, delImgS3 } = require('./../utils/s3Functions')

router.get('/:id', async (req, res, next) => {
	let db = res.locals.client.db('czaudiovisual')
	let id = ObjectId(req.params.id)
	let album = await getAlbum(db, id)
	if(!album.name) {
		res.status(404).json({ err: 'Not album found' })
		return
	}
	res.locals.client.close()
	res.render('album', { album: album })
})

router.post('/:id/delete', function (req, res, next) {
	let db = res.locals.client.db('czaudiovisual')
	let id = ObjectId(req.params.id)
	let img = req.body.img
	let imgS3Path = img.split(process.env.IMG_DB_SERVICE)[1]
	delImgS3(imgS3Path)
		.then( data => {
			delImgDb(db, id, img)
				.then(status => {
						res.locals.client.close()
						res.status(200).json({ message: "Image deleted"})
				}).catch(err => {
					res.locals.client.close()
					res.status(400).json({ error: err })
				})
		}) .catch(err => {
			res.status(400).json({ message: err })
		})
		
})

router.post('/:id/add', async (req, res, next) => {
	let db = res.locals.client.db('czaudiovisual')
	let id = ObjectId(req.params.id)
	let documentName = (await getAlbum(db, id)).name

	if(!documentName) {
		res.status(400).json({ error: 'Not album found' })
		return
	}
	
	let imgs = req.body.imgsBatch
	let promises = []
	let added = []

	promises = imgs.map(async imgData => {
		let imgType = imgData.split(";")[0].split("/")[1],
			imgName = documentName + "/img_" + Date.now() + "_" + Math.random().toString().split(".")[1]
		added.push({ data: imgData, name: `${process.env.IMG_DB_SERVICE}czaudiovisual/${imgName}`})
		
		
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

	try {
		let dbResults = await Promise.all(promises)
		let s3Results = await Promise.all(dbResults.map(img => addImgS3(img)))

		res.status(200).json({ data: added})
	} catch(err) {
		console.log(err);
		res.status(400).json({ error: err})
	}
	
})

module.exports = router
