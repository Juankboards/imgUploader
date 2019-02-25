const express = require('express'),
	router = express.Router(),
	ObjectId = require('mongodb').ObjectID,
	{ getAlbum, getAlbums, addAlbum, delAlbumDb } = require('./../utils/dbFunctions'),
	{ delImgS3 } = require('./../utils/s3Functions')

router.get('/', async (req, res, next) => {
	let db = res.locals.client.db('czaudiovisual')
	let albums = await getAlbums(db)
	res.locals.client.close()
	res.render('albums', { albums })
})

router.post('/add', async (req, res, next) => {
	let db = res.locals.client.db('czaudiovisual')
	let album = req.body;
	album.photos = []
	album.id = await addAlbum(db, album).str
	if(!album._id) {
		res.status(502).json({ error: "Could't add album"})
		return
	}
	res.status(201).json({ data: album})
})

router.post('/:id/delete', async (req, res, next) => {
	let db = res.locals.client.db('czaudiovisual')
	let id = ObjectId(req.params.id)
	let album = await getAlbum(db, id)
	if(!album.name) {
		res.status(400).json({ error: 'Not album found' })
		return	
	}
	try {
		await Promise.all(album.photos.map(img => delImgS3(img.split('.com/')[1])))
	} catch(err) {
		res.status(400).json({ error: err})
		return
	}
	let deleted = await delAlbumDb(db, id)	
	if(!deleted) {
		res.status(400).json({ error: 'couldn\'t delete album' })
		return
	}
	
	res.status(200).json({ data: 'Album deleted'})	
})

module.exports = router
