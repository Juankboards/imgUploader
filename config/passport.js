const JWTStrategy  = require('passport-jwt').Strategy,
    LocalStrategy = require('passport-local').Strategy,
    bcrypt = require('bcrypt'),
    { getUserByEmail } = require('./../utils/dbFunctions')

    require('dotenv').config()

function cookieExtractor(req) {
    let token = (req && req.cookies)? req.cookies['jwt'] : undefined
    return token
};

function passportConfig(db, passport) {
    passport.use(new LocalStrategy({
            usernameField: "email",
            passwordField: "password",
        }, async (email, password, done) => {
            try {
                const user = await getUserByEmail(db, { email })
                if(!user.email) return done("Incorrect Email")
                const passwordsMatch = await bcrypt.compare(password, user.password)
                if(!passwordsMatch) return done("Incorrect Password")
                return done(null, user)
            } catch (error) {
                done(error)
            }
    }))

    passport.use(new JWTStrategy({
        jwtFromRequest: cookieExtractor,
        secretOrKey: process.env.JWT_SECRET,
    }, async (jwtPayload, done) => {
        if (Date.now() > jwtPayload.expires) return done('jwt expired')
        let user = await getUserByEmail(db, { email: jwtPayload.email })
        if (!user.email) return done("Not user found with that email")
        delete user.password
        done(null, user)
    }))
}



module.exports = passportConfig