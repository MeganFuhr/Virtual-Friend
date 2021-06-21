const express = require('express')

const registerRouter = express.Router();

registerRouter.route('/').get((req, res) => {
	res.render('register')
})

module.exports = registerRouter