const express = require('express'),
	router = express.Router(),
	passport = require('passport'),
	bcrypt = require('bcrypt'),
	jwt = require('jsonwebtoken'),
	{ addUser } = require('./../utils/dbFunctions')

router.get('/', passport.authenticate('jwt', { session: false, successRedirect: '/albums', failureRedirect: "/login" }))

router.get('/login', (req, res) => {
	res.render('login')
})

router.post('/login', (req, res, next) => {
	passport.authenticate("local", { session: false }, (error, user) => {	
		if(error) return res.status(400).json({ error })
		const payload = {
			email: user.email,
			expires: Date.now() + parseInt(process.env.JWT_EXPIRATION_MS)
		}
		req.login(payload, {session: false}, error => {
			if (error) return res.status(400).send({ error })
			const token = jwt.sign(JSON.stringify(payload), process.env.JWT_SECRET);
			res.cookie('jwt', token, { httpOnly: true });
			res.status(200).send({ data: payload });
		})
	})(req, res)
})

router.post('/signup', async (req, res, next) => {
	let db = res.locals.client.db(process.env.IMG_DB_NAME)
	let user = { email: req.body.email.toLowerCase(), password: req.body.password, albums: [] }
	
	try {
		user.password = await bcrypt.hash(user.password, 10)
		await addUser(db, user)
		if(!user._id) throw ("Could't register user")
		delete user.password
		res.status(201).json({ data: user})
	} catch (error) {
		res.status(400).json({ error })
	}
})

router.get('/logout', passport.authenticate('jwt', { session: false }), function(req, res) {
    res.cookie('jwt', '', { httpOnly: true });
    res.status(200).json({ data: 'signout' });
}); 

module.exports = router
