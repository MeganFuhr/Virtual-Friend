const { MongoClient } = require('mongodb')
const passport = require('passport')
const { Strategy } = require('passport-local')
require('dotenv').config()
const bcrypt = require('bcryptjs')
const debug = require('debug')('app:localStrategy')

module.exports = function localStrategy() {
    passport.use(new Strategy({
        usernameField: 'email',
        passwordField: 'password'
    }, (email, password, done) => {
        const mongourl = process.env['MONGO_URI']
        const dbName = 'Virtual-Friend';

        (async function validateUser(){
            let client
            client = await MongoClient.connect(mongourl)
            debug('Connected to the mongo DB')

            const db = client.db(dbName)
            const user = await db.collection('users').findOne({email : email.toLowerCase()})
            
            
            if (user == null){
                return done(null, false, { message: 'User is not registered.' });
            } 
            try {                
                if (await bcrypt.compare(password, user.password)) {
                    done(null, user)
                    res.redirect('/')
                }
                else {
                    return done(null, false, {message: 'Incorrect username or password.'})
                }
            }catch(error){
                debug(error)
            }
            client.close()
        }())
    }))
}