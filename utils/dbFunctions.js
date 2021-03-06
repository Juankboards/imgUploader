function addImgDb(db, id, imgName) {
	return db.collection("folders").findOneAndUpdate({ "_id": id }, { $push: { "photos": `${process.env.IMG_DB_SERVICE}${process.env.DB_NAME}/${imgName}` } }, { returnOriginal: false })
}

function delImgDb(db, id, img) {
	return db.collection("folders").updateOne({ "_id": id }, { $pull: { "photos": img } })
}

function getAlbum(db, id) {
    return db.collection("folders").findOne({ "_id": id })
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
            if(result && result.insertedId ) return true
            throw ('Non album inserted')
        })
}

function delAlbumDb(db, id) {
    return db.collection("folders").deleteOne({ "_id": id })
        .then(result => {
            if(result && result.deletedCount ) return true
            throw ('Non album deleted')
        })
}

function getUserByEmail(db, email) {
    return db.collection("users").findOne(email)
        .then(user => {
            if(user && user.email ) return user
            throw ('Incorrect Email')
        })
}

function getUserDataAsync(db, email) {
    return db.collection("users").aggregate([
        { 
            $match : email
        },
        {
            $unwind: "$albums"
         },
        {            
            $lookup:
                {
                from: "folders",
                localField: "albums",
                foreignField: "_id",
                as: "album"
                }
        },
        {
            $project :{
                password: 0,
            }
        }
    ]).toArray()
}

function addUser(db, user) {
    return db.collection('users').insertOne(user)
        .then(result => {
            if(result && result.insertedId ) return result.insertedId
            throw ('Non user inserted')
        })
}

function addAlbumFromUser(db, userId, albumId) {
    return db.collection('users').updateOne({ "_id": userId}, { $push: { "albums": albumId } })
}

function removeAlbumFromUser(db, userId, albumId) {
    return db.collection('users').updateOne({ "_id": userId}, { $pull: { "albums": albumId } })
}

module.exports = {
    addImgDb,
    delImgDb,
    getAlbum,
    addAlbum,
    delAlbumDb,
    getUserByEmail,
    getUserDataAsync,
    addUser,
    addAlbumFromUser,
    removeAlbumFromUser
}