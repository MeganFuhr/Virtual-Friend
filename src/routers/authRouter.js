const express = require('express')
const debug = require('debug')('app:authRouter');
const { MongoClient, ObjectID } = require('mongodb');
const passport = require('passport');

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
            console.log(temp)
            if(temp) {
                console.log("User already exists.")
                req.flash('error', 'User already exists.')
                res.redirect('/auth/register')
            }
        } catch (error) {
            console.log(error)
        }       
    })()

/*     (async function addUser(){
        let client

        try {
            client = await MongoClient.connect(mongourl)
            const db = client.db(dbName)

            const user = {email, password}
            const results = await db.collection('users').insertOne(user)
            debug(results)
            req.login(results.ops[0], () => {
                res.redirect('/virtual-j')
            })
        }
        catch (error) {
            debug(error)
        }
        client.close()
    }) ()*/
})

authRouter
    .route('/signIn')
    .get((req,res) => {
        res.render('signin')
})
    .post(passport.authenticate('local', {
    successRedirect: '/virtual-j',
    failureMessage: '/',
    })
)

authRouter.route('/profile').get((req,res) => {
    res.json(req.user)
})

module.exports = authRouter