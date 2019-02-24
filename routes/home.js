const express = require('express'),
	router = express.Router()
	// ObjectId = require('mongodb').ObjectID

router.get('/', (req, res, next) => {
	res.render('home', { user: {} })
})

module.exports = router
