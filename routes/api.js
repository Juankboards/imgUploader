const express = require('express'),
	router = express.Router(),
	// ObjectId = require('mongodb').ObjectID,
	{ getUserDataAsync } = require('./../utils/dbFunctions')

router.get('/', async (req, res, next) => {
    const db = res.locals.client.db(process.env.IMG_DB_NAME)
    const users = [].concat(req.query.user)
    let promises  = []
    users.forEach( email => promises.push(getUserDataAsync(db, { email })))
    Promise.all(promises)
        .then(results => {
            results = results.filter(result => result.length)
            console.log(results)
            res.status(201).json({ results })
        })
        .catch(err => res.status(400).json({ err }))
})

module.exports = router
