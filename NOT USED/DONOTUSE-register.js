const express = require('express')
const bcrypt = require('bcrypt')

const registerRouter = express.Router();

//const users = []

registerRouter.route('/').get((req, res) => {
	//ejs looks in views.
	res.render('register')
})

registerRouter.route('/')
	.post(async (req,res) => {
		try {
			const hashedPassword = await bcrypt.hash(req.body.password, 10)
		//TODO MongoDB
		users.push({
			id: Date.now().toString(),
			name: req.body.name,
			email: req.body.email,
			password: hashedPassword
		})
		res.redirect('/login')
		} catch (error) {
			res.redirect('/register')
		}
		console.log(users)
	})

module.exports = registerRouter