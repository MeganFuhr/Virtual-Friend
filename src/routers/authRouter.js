const express = require('express')
const debug = require('debug')('app:authRouter');
const { MongoClient }= require('mongodb');
const passport = require('passport');
const bcrypt = require('bcryptjs')

const authRouter = express.Router()
const mongourl = process.env['MONGO_URI']

authRouter.route('/register').get((req, res) => {
	//ejs looks in views.
	res.render('register')
})

authRouter.route('/register').post((req, res) => {

    const {email, password} = req.body
    const dbName = 'Virtual-Friend';

    (async function checkUser() {
        let client
        let temp
        client = await MongoClient.connect(mongourl)
        const db = client.db(dbName)

        try {
            const temp = await db.collection('users').findOne({email : email})
            if(temp) {
                req.flash('duplicate_email_error', 'User email is already registered.')
                res.redirect('/auth/register')
            } else {
                try {
                    const hashPassword = await bcrypt.hash(password, 10)
                    console.log(hashPassword)
                    const results = await db.collection('users').insertOne({email:email.toLowerCase(), password: hashPassword})
                    debug(results)
                    res.redirect('/')
                } catch(error){
                    debug(error)
                }
            }
        } catch (error) {
            debug(error)
        }       
    })()
})

authRouter
    .route('/signIn')
    .get((req,res) => {
    res.render('signin')
})
    .post(passport.authenticate('local', {
    successRedirect: '/virtual-j',
    failureRedirect: '/',
    failureFlash: true,
    })
)

module.exports = authRouter