const express = require('express'),
	router = express.Router()

// function getAlbums(db) {
// 	return db.collection("folders").find().toArray()
// 		.then(items => {
// 			return items
// 		})
// 		.catch(err => {
// 			console.log(err)
// 			return []
// 		})
// }

router.post('/', function (req, res, next) {
	let albumInfo = req.body;
	albumInfo.photos = []
	albumInfo.created = new Date().getTime()
	let db = res.locals.client.db('czaudiovisual')
	try {
		db.collection('folders').insertOne(albumInfo)
		res.status(201).json({ result: true})
	} catch (err) {
		res.status(502).json({ error: err});
	}
})

module.exports = router
