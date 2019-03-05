const JWTStrategy  = require('passport-jwt').Strategy,
    LocalStrategy = require('passport-local').Strategy,
    bcrypt = require('bcrypt'),
    { getUserByEmail } = require('./../utils/dbFunctions')

if(!process.env.NODE_ENV) require('dotenv').config()

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
                const passwordsMatch = await bcrypt.compare(password, user.password)
                if(!passwordsMatch) return done("Incorrect Password")
                return done(null, user)
            } catch (error) {
                console.log(error);
                
                done(error)
            }
    }))

    passport.use(new JWTStrategy({
        jwtFromRequest: cookieExtractor,
        secretOrKey: process.env.JWT_SECRET,
    }, async (jwtPayload, done) => {
        try {
            if (Date.now() > jwtPayload.expires) throw ('jwt expired')
            let user = await getUserByEmail(db, { email: jwtPayload.email })
            delete user.password
            done(null, user)
        } catch(error) {
            done(error)
        }
        
    }))
}



module.exports = passportConfig