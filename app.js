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
const http = require('http')
const socketio = require('socket.io')

const PORT = process.env.PORT || 3000
const app = express()

//configuring socket.io
const server = http.createServer(app)
const io = socketio(server);

//routes pages
const authRouter = require('./src/routers/authRouter')
const virtaulJRouter = require('./src/routers/virtualJRouter')
const { emit } = require('process')
const { setInterval } = require('timers')

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
//server.listen is required now instead of app.listen.  server has the websocket attached now and not app
server.listen(PORT,() =>
	debug(`I'm listening on port ${chalk.green(PORT)}`)
)

app.get('/', (req, res) => {
	res.render('index', {name: "Welcome to Kung Fu J!"})
})

////////////////////Socket.io///////////////////
io.on('connection', function(socket) {
	console.log('new connection made')

	socket.emit(('message-from-server'), 
		'Hello from server')
	
	socket.on('message-from-client', function(msg) {
		console.log(msg)
	})

	//set visibility at connection time
	if(jIsHungry){
		socket.emit('feed-j', true)
	}

	//if the client fed J, change variable to false
	socket.on('fed-j', function(msg) {
		console.log(`Client fed j and returned: ${msg}`)
		jIsHungry = msg
		clearInterval(hungerInterval)
		console.log("Resetting hungerInterval")
		setInterval(checkIfHungry, 7000)
	})

	//need to send update to client that jIsHunger=true again.
 	setInterval(function() {
		if(jIsHungry === true) {
			socket.emit('feed-j', true)
		}
	}, 1000) 

})


//the life drain should run regardless of a connection
//Hunger = 100
//hunger ticks down 
//variables for status of J
//const maxHunger = 100
//var currentHunger = 100

//let's pretend J gets hungry every 4 hours
var jIsHungry = new Boolean(false)

var hungerInterval = setInterval(checkIfHungry, 7000)

function checkIfHungry(){
	console.log("7 seconds passed, J is hungry")
	jIsHungry = true
}


/* //maybe set interval to ever hour to check.  
setInterval(feedJ, 1000)

function feedJ () {
	currentHunger--
	console.log(currentHunger)
	if(currentHunger <= 95){
		console.log("J is hungry!!")
	}
	
	if(currentHunger == 0){

	}
} */
