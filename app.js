const express = require('express')
const chalk = require('chalk')
const debug = require('debug')('app')
const morgan = require('morgan')
const path = require('path')

const PORT = process.env.PORT || 3000
const app = express()

const registerRouter = require('./src/routers/register')

//morgan monitors web traffic. options are tiny or combined
app.use(morgan('tiny'))
app.use(express.static(path.join(__dirname, '/public/')))
app.use(express.Router())

app.set('views','./src/views')
app.set('view engine', 'ejs')
app.use('/register', registerRouter)
//chalk is just an easy way to color text
//set debug=* & node app.js will debug all packages. debug=app & node app.js will debug just app
app.listen(PORT,() =>
	debug(`I'm listening on port ${chalk.green(PORT)}`)
)

app.get('/', (req, res) => {
	res.render('index', {title: "Welcome to Kung Fu J!", data: ['a','b','c']})
})
