const express = require('express'),
	MongoClient = require('mongodb').MongoClient,
	path = require('path'),
	compression = require('compression'),
    bodyParser = require('body-parser'),
    hbs = require('express-handlebars'),
    request = require('request'),
    albums = require('./routes/albums'),
    album = require('./routes/album')
    newAlbum = require('./routes/newAlbum')

const port = process.env.PORT || 8080,
	app = express()


app.use(function(req, res, next) {
	MongoClient.connect(process.env.DB_CONNECTION, { useNewUrlParser: true }, (err, client) => {
		if (err)
			console.log(err)
		res.locals.client = client
	    next();
	})
});
app.use(compression())
app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')))

app.engine('hbs', hbs({ 
  extname: 'hbs', 
  defaultLayout: 'main', 
  layoutsDir: path.join(__dirname, '/views/layouts/'),
  partialsDir: path.join(__dirname, '/views/')
}))
app.set( 'view engine', 'hbs' );

// routes
app.use('/', albums)
app.use('/album/', album)
app.use('/create-album', newAlbum)

app.listen(port, () => console.log(`App listening to port ${port}`))