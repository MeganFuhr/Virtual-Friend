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
const fetch = require('node-fetch')

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
const { Console } = require('console')
const { SSL_OP_NO_TICKET } = require('constants')

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

//https://http.cat/
app.get('*', function(req, res){
	res.redirect('https://http.cat/404')
  });

////////////////////Socket.io///////////////////
io.on('connection', function(socket) {
	console.log('new connection made')

	///////////////////////TELL CLIENTS MESSAGES////////////////////////
	//set visibility at connection time
	if(jIsHungry = true){
		//changed to io.emit from socket.emit so every connection knows J is hungry
		io.emit('feed-j', true)
	}

	if(jIsSleepy){
		io.emit('sleep-j', true)
	}
	else{
		io.emit('sleep-j', false)
	}
	////////////////////////////////////////////////////////////////////

	///////////////////////////HUNGRY EVENTS////////////////////////////
	socket.on('fed-j', function(msg) {
		if(jIsHungry && jIsAsleep) {
				socket.emit('jIsAsleep', {message : "Server: J is asleep and cannot eat."})
				console.log(`jIsHungry: ${jIsHungry} and jIsAsleep: ${jIsAsleep}`)
			}
		if(jIsHungry && !(jIsAsleep)){
			console.log(`jIsHungry: ${jIsHungry} and jIsAsleep: ${jIsAsleep}`)
			//need to tell all clients J has been fed by updating the class on f
			io.emit('update-all-clients-fed','Server: a-client-fed-j')
			jIsHungry = false
			startHungerInterval()
			hungerMessageSentOnce = false
			console.log("Resetting hungerInterval")
		} else {
			//TODO : Tell client j isn't hungry.
			console.log("J isn't hungry.")
			socket.emit('jNotHungry', {message : "Server: J isn't hungry."})
			console.log(`jIsHungry: ${jIsHungry}`)
		} 
	})

	///////////////////////////SLEEP EVENTS////////////////////////////
	//if a client put J to sleep, change variable to false
	socket.on('sleep-j', function(msg) {
		if(jIsAsleep === true){
			console.log(`J is asleep and can't be put to sleep`)
			io.emit('update-client-j-already-asleep', {message :'Server: J is already asleep.'})
			return
		}
		if(jIsSleepy === true) {
			console.log(`Client put J to sleep and returned: ${msg}`)
			//need to tell all clients J has been fed by updating the class on f
			io.emit('update-all-clients-sleep', {message :'Server: a-client-sleep-j'})
			jIsSleepy = msg
			jIsAsleep = true
			sleepyMessageSentOnce = false
		} else {
			//TODO : Tell client j isn't hungry.
			console.log("J isn't sleepy.")
			socket.emit('jNotSleepy', {message : "Server: J isn't sleepy."})
		}
	})

	//need to send update to client that jIsHunger=true again.
	setInterval(function() {
		if(jIsHungry === true) {
			//changed from socket.emit to io.emit so all clients know J is hungry.
			//at the same time
			io.emit('feed-j', true)
			if(hungerMessageSentOnce === false){
				hungerMessageSentOnce = true	
				//disabled webhook messaging while testing		
				sendDiscordMessage(hungerMessage)
			}
		}
	}, 10000) 
	////////////////////////////////////////////////////////////////////

})

//https://leovoel.github.io/embed-visualizer/
discordHook = process.env.DISCORD_HOOK


//hunger
hungerMessage = "J is hungry.  Please feed him. :pleading_face: [Virtual-j](https://virtual-j-test.herokuapp.com)"
hungerMessageSentOnce = false
var jIsHungry = true
var hungerInterval

//sleep
sleepMessage = "J should be in bed. Please make him go to sleep. :sleeping: [Virtual-j](https://virtual-j-test.herokuapp.com)"
sleepyMessageSentOnce = false
jIsSleepy = false
jIsAsleep = false
var t = new Date()
var currentTime = t.getUTCHours()

//send discord message
function sendDiscordMessage(message) {
	const msg = {
		"content": message,
		"name": "ZilloBotTest",
		"avatar" : "https://raw.githubusercontent.com/MeganFuhr/BingaGifs/main/j5.png"
		}
	
		fetch(discordHook + "?wait=true", {
			"method":"POST", 
			"headers": {
				"content-type": "application/json"},
			"body": JSON.stringify(msg)})
			.then(res=>res.json()).then(console.log)
	}

///////////////////////////HUNGER////////////////////////////
//start hunger interval at start of app.js
startHungerInterval()

//interval for hunger - 4 hours 14400000 milliseconds
function startHungerInterval() {
	clearInterval(hungerInterval)
	hungerInterval = setInterval(checkIfHungry, 7200000)
}

//check jIsHungry variable
function checkIfHungry(){
	//if J is awake, he can be hungry
	if (jIsSleepy === false) {
		jIsHungry = true
	}
}
////////////////////////////////////////////////////////////////////



///////////////////////////SLEEP EVENTS////////////////////////////
startSleepInterval()

//check every minute if J is sleepy
function startSleepInterval() {
	setInterval(checkIfSleepy, 61000)
}

//check if J is sleepy
//utc. 0 = 8pm ET, 10 6am et
function checkIfSleepy(){
	if(currentTime >= 0 && currentTime < 10){
		console.log("J is tired.  Please turn off the lights.")
		jIsSleepy = true
		io.emit('j-is-sleepy', {message : "Server: J is tired. Please turn off the lights."})
		sendDiscordMessage(sleepMessage)
		sleepyMessageSentOnce = true
	}
	if (currentTime >= 10 && currentTime < 20){
		console.log("J should be awake.")
		jIsAsleep = false
		io.emit('update-client-j-daytime', "wake-j-up-state-class-css")
	}
	else {
		io.emit('j-is-awake', {message : "Server: J in not tired and should be awake."})
		jIsSleepy = false
		jIsAsleep = false
	}
}
////////////////////////////////////////////////////////////////////

//all variables
console.log(`hungerMessageSentOnce: ${hungerMessageSentOnce}`)
console.log(`jIsHungry: ${jIsHungry} and `+  typeof(jIsHungry))
console.log(`jIsSleepy: ${jIsSleepy}` + typeof(jIsSleepy))
console.log(`jIsAsleep: ${jIsAsleep}` + typeof(jIsAsleep))
console.log(`currentTime hours in UTC: ${currentTime}`)

