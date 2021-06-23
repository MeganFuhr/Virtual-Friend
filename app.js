if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config()
}

const express = require('express')
const chalk = require('chalk')
const debug = require('debug')('app')
const morgan = require('morgan')
const path = require('path')
const flash = require('express-flash')
const session = require('express-session')
const cookieParser = require('cookie-parser')

const PORT = process.env.PORT || 3000
const app = express()

//routes pages
//const registerRouter = require('./src/routers/register')
const authRouter = require('./src/routers/authRouter')
const virtaulJRouter = require('./src/routers/virtualJRouter')

//morgan monitors web traffic. options are tiny or combined
app.use(morgan('tiny'))
app.use(express.static(path.join(__dirname, '/public/')))
app.use(express.json())
app.use(express.urlencoded({extended:false}))
app.use(cookieParser())
app.use(session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: false
}))
require('./src/config/passport.js')(app)

app.set('view engine', 'ejs')
app.set('views','./src/views')

app.use(flash())

app.use(function(req, res, next) {
	res.locals.duplicate_email_error = req.flash('duplicate_email_error');
	res.locals.login_error = req.flash('login_error');
	next();
  });

app.use('/auth', authRouter)
app.use('/virtual-j', virtaulJRouter)

//chalk is just an easy way to color text
//set debug=* & node app.js will debug all packages. debug=app & node app.js will debug just app
app.listen(PORT,() =>
	debug(`I'm listening on port ${chalk.green(PORT)}`)
)

app.get('/', (req, res) => {
	res.render('index', {name: "Welcome to Kung Fu J!"})
})