const express = require('express'),
	router = express.Router()

function getAlbums(db) {
	return db.collection("folders").find().toArray()
		.then(items => {
			return items
		})
		.catch(err => {
			console.log(err)
			return []
		})
}

router.get('/', function (req, res, next) {
	let db = res.locals.client.db('czaudiovisual')
	getAlbums(db)
	.then(albums => {
		res.locals.client.close()
		res.render('albums', { albums })
	})
})

module.exports = router
