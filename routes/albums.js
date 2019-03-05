const express = require('express'),
	router = express.Router(),
	ObjectId = require('mongodb').ObjectID,
	{ getAlbum, addAlbum, delAlbumDb, addAlbumFromUser, removeAlbumFromUser } = require('./../utils/dbFunctions'),
	{ delImgS3 } = require('./../utils/s3Functions')

router.get('/', async (req, res, next) => {
	try {
		let db = res.locals.client.db(process.env.IMG_DB_NAME)
		let albums = await Promise.all(req.user.albums.map(async album => await getAlbum(db, ObjectId(album))))
		res.locals.client.close()
		res.render('albums', { user: req.user, albums })
	}catch(error) {
		res.render('404')
	}
	
})

router.post('/add', async (req, res, next) => {
	let db = res.locals.client.db(process.env.IMG_DB_NAME)
	let album = req.body;
	album.photos = []
	try {
		await addAlbum(db, album)
		await addAlbumFromUser(db, req.user._id, album._id)
		if(!album._id) return res.status(502).json({ error: "Could't add album"})
		res.status(201).json({ data: album})
	} catch(err) {
		res.status(400).json({ error: err.toString() })
	}	
})

router.post('/:id/delete', async (req, res, next) => {
	let db = res.locals.client.db(process.env.IMG_DB_NAME)
	let id = ObjectId(req.params.id)
	try {
		let album = await getAlbum(db, id)
		if(!album.name) throw ('Not album found')
		await Promise.all(album.photos.map(img => delImgS3(img.split('.com/')[1])))
		await delAlbumDb(db, id)	
		await removeAlbumFromUser(db, req.user._id, album._id)
		res.status(200).json({ data: 'Album deleted'})
	} catch(err) {
		res.status(400).json({ error: err})
	}	
})

module.exports = router
