const express = require('express'),
	MongoClient = require('mongodb').MongoClient,
	path = require('path'),
	compression = require('compression'),
  cookieParser = require('cookie-parser'),
  passport = require('passport'),
  hbs = require('express-handlebars'),
  passportConfig =require('./config/passport'),
  home = require('./routes/home'),
  albums = require('./routes/albums'),
  album = require('./routes/album')
  
if(!process.env.NODE_ENV) require('dotenv').config()

const port = process.env.PORT || 8080,
app = express()


app.use(function(req, res, next) {
	MongoClient.connect(process.env.DB_CONNECTION, { useNewUrlParser: true }, (err, client) => {
		if (err) return console.log(err)
    passportConfig(client.db(process.env.IMG_DB_NAME), passport)
		res.locals.client = client
	  next();
	})
});

app.use(compression())
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended:false }));
app.use(express.static(path.join(__dirname, 'public')))
app.use(cookieParser())

app.engine('hbs', hbs({ 
  extname: 'hbs', 
  defaultLayout: 'main', 
  layoutsDir: path.join(__dirname, '/views/layouts/'),
  partialsDir: path.join(__dirname, '/views/')
}))
app.set( 'view engine', 'hbs' );

// routes
app.use('/', home)
app.use('/albums', passport.authenticate('jwt', { session: false, failureRedirect: "/login" }), albums)
app.use('/album', passport.authenticate('jwt', { session: false, failureRedirect: "/login" }), album)
app.get('*', (req, res) => res.render('404'))

app.listen(port, () => console.log(`App listening to port ${port}`))