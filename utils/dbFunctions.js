function addImgDb(db, id, imgName) {
	return db.collection("folders").findOneAndUpdate({ "_id": id}, { $push: { "photos": `${process.env.IMG_DB_SERVICE}czaudiovisual/${imgName}` } }, { returnOriginal: false })
}

function delImgDb(db, id, img) {
	return db.collection("folders").updateOne({ "_id": id}, { $pull: { "photos": img } })
}

function getAlbum(db, id) {
    return db.collection("folders").findOne({ "_id": id})
        .then(album => {
            return album
        })
        .catch(err => {
            console.log(err)
            return {}
        })
}

function getAlbums(db) {
	return db.collection("folders").find().toArray()
		.then(albums => {
			return albums
		})
		.catch(err => {
			console.log(err)
			return []
		})
}

function addAlbum(db, album) {
    return db.collection('folders').insertOne(album)
        .then(result => {
            if(result.insertedId ) return true
            throw ('Non album inserted')
        })
        .catch(err => {
            console.log(err)
            return false
        })
}

function delAlbumDb(db, id) {
    return db.collection("folders").deleteOne({ "_id": id })
        .then(result => {
            if(result.deletedCount ) return true
            throw ('Non album deleted')
        })
        .catch(err => {
            console.log(err)
            return false
        })
}

function getUserByEmail(db, email) {
    return db.collection("users").findOne(email)
        .then(user => {
            return user || {}
        })
        .catch(err => {
            console.log(err)
            return {}
        })
}

function addUser(db, user) {
    return db.collection('users').insertOne(user)
        .then(result => {
            if(result.insertedId ) return result.insertedId
            throw ('Non user inserted')
        })
        .catch(err => {
            console.log(err)
            return false
        })
}

module.exports = {
    addImgDb,
    delImgDb,
    getAlbum,
    getAlbums,
    addAlbum,
    delAlbumDb,
    getUserByEmail,
    addUser
}