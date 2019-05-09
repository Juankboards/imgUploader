const express = require('express'),
	router = express.Router(),
	{ getUserDataAsync } = require('./../utils/dbFunctions')

router.get('/', async (req, res, next) => {
    const db = res.locals.client.db(process.env.IMG_DB_NAME)
    const users = [].concat(req.query.user)
    let promises  = []
    users.forEach( email => promises.push(getUserDataAsync(db, { email })))
    Promise.all(promises)
        .then(data => {
            data = [].concat(...data.filter(result => result.length))
            res.status(201).json({ data })
        })
        .catch(err => res.status(400).json({ err }))
})

module.exports = router
