const express = require('express')

const virtualJRouter = express.Router();


virtualJRouter.route('/').get((req, res) => {
	//ejs looks in views.
	res.render('virtual-j')
})

module.exports = virtualJRouter