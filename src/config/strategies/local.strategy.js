const { MongoClient } = require('mongodb')
const passport = require('passport')
const { Strategy } = require('passport-local')
require('dotenv').config()
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
            try {
                client = await MongoClient.connect(mongourl)
                debug('Connected to the mongo DB')

                const db = client.db(dbName)

                const user = await db.collection('users').findOne({email})
                if (user && user.password === password) {
                    done(null, user)
                } else {
                    done(null, false)
                }
                
            } catch (error) {
                done(error, false)
            }
            client.close()
        }())
    }))
}