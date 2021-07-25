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

	///////////////////////SET CLIENT STATE AT CONNECTION////////////////////////
	if(jIsHungry === true){
		//changed to io.emit from socket.emit so every connection knows J is hungry
		io.emit('state-hungry', {message: 'Server On Connection: j is hungry',state: 'true'})
	}
	///this isn't working correctly.
	if(jIsSleepy === true && jIsAsleep === false){
		io.emit('state-sleepy', {message: 'Server On Connection: J is sleepy', state:'true'})
	}

	if(jIsSleepy === true){
		io.emit('state-sleepy', {message : "Server: J is tired.", state: 'true'})
	}

	////////////////////////////////////////////////////////////////////


	///////////////////////////HUNGRY EVENTS////////////////////////////
	socket.on('action-fed', function(msg) {
		//can't feed J if he is a asleep
		if(jIsHungry === true && jIsAsleep === true) {
				socket.emit('jIsAsleep', {message : "Server: J is asleep and cannot eat.", state: 'true'})
				console.log(`jIsHungry: ${jIsHungry} and jIsAsleep: ${jIsAsleep}`)
				return
			}
		//j is hungry and not asleep, we can feed him
		if(jIsHungry === true && jIsAsleep === false){
			console.log(`jIsHungry: ${jIsHungry} and jIsAsleep: ${jIsAsleep}`)
			//need to tell all clients J has been fed by updating the class on f
			io.emit('update-all-clients-fed','Server: a-client-fed-j')

			jIsHungry = false

			//restart hunger interval
			startHungerInterval()
			hungerMessageSentOnce = false

			console.log(`Resetting hungerInterval`)
			return			
		} 
		//if j is not hungry and asleep, we cannot feed him because he is asleep.
		if (jIsHungry === false && jIsAsleep === true) {
			//assuming last condition is jIsHungry = false, so we cannot feed him.
			//Tell client j isn't hungry.
			console.log(`J isn't hungry.`)
			socket.emit('state-hungry', {message : "Server: J is asleep.", state : 'false'})
			console.log(`jIsHungry: ${jIsHungry}`)
			return
		} 
		if (jIsHungry === false) {
			//assuming last condition is jIsHungry = false, so we cannot feed him.
			//Tell client j isn't hungry.
			console.log(`J isn't hungry.`)
			socket.emit('state-hungry', {message : "Server: J isn't hungry.", state : 'false'})
			console.log(`jIsHungry: ${jIsHungry}`)
			return
		} 
	})
 
	///////////////////////////SLEEP EVENTS////////////////////////////
	//if a client put J to sleep, change variable to false
	socket.on('action-sleep', function(msg) {
		//If J is asleep, we cannot make him asleep again
		if(jIsAsleep === true){
			console.log(`J is asleep and can't be put to sleep`)
			io.emit('state-sleepy', {message :'Server: J is already asleep.', state: 'alreadyAsleep'})
			return
		}
		//if J is sleepy but not asleep, we can put him to sleep
		if(jIsSleepy === true && jIsAsleep === false) {
			console.log(`Client put J to sleep and returned: ${msg}`)

			//need to tell all clients J has been fed by updating the class on f
			io.emit('update-all-clients-sleep', {message :'Server: a-client-sleep-j', state: 'true'})
			jIsSleepy = false
			jIsAsleep = true	
			return
		} else {
			console.log(`J isn't sleepy.`)
			socket.emit('state-sleepy', {message : "Server: J isn't sleepy.", state: 'jIsntSleepy'})
			return
		}
	})
})
////////////////////////////////////////////////////////////////////


discordHook = process.env.DISCORD_HOOK
link = process.env.localhost || "https://virtual-j.herokuapp.com"

//hunger
hungerMessage = `J is hungry.  Please feed him. :pleading_face: [Virtual-j](${link})`
hungerMessageSentOnce = false
var jIsHungry = false
var hungerInterval

//sleep
sleepMessage = `J should be in bed. Please make him go to sleep. :sleeping: [Virtual-j](${link})`
sleepyMessageSentOnce = false
jIsSleepy = false
jIsAsleep = false
var t = new Date()
var currentTime = t.getUTCHours()

//gifs
const hungerGif = "https://github.com/MeganFuhr/BingaGifs/blob/main/JGifs/J-HUNGRY-CHIBI-02.gif?raw=true"
const sleepyGif = "https://github.com/MeganFuhr/BingaGifs/blob/main/JGifs/J-SLEEPY-CHIBI-02.gif?raw=true"
const asleepGif = "https://github.com/MeganFuhr/BingaGifs/blob/main/JGifs/J-ASLEEP-CHIBI-06.gif?raw=true"
const eatingGif = "https://github.com/MeganFuhr/BingaGifs/blob/main/JGifs/J-EATING-CHIBI-02.gif?raw=true"
const idleGif = "https://github.com/MeganFuhr/BingaGifs/blob/main/JGifs/J-IDlE-CHIBI-01.gif?raw=true"

var gifsToClient = []

//send discord message
function sendDiscordMessage(message, gif, state) {
	const msg = {
		"username": "ZilloBot",
		"avatar_url": "https://raw.githubusercontent.com/MeganFuhr/BingaGifs/main/j5.png",
		"embeds": [
		  {
			"author": {
			  "name": "ZilloBot",
			  "url": link,
			  "icon_url": "https://raw.githubusercontent.com/MeganFuhr/BingaGifs/main/j5.png"
			},
			"title": state,
			"url": link,
			"description": message,
			"color": 15258703,
			"thumbnail": {
			  "url": gif
			},
		  }
		]
	  }
	  
	
		fetch(discordHook + "?wait=true", {
			"method":"POST", 
			"headers": {
				"content-type": "application/json"},
			"body": JSON.stringify(msg)
		})
			.then(res=>res.json()).then(console.log)
}

///////////////////////////HUNGER////////////////////////////
//start hunger interval at start of app.js
startHungerInterval()

//interval for hunger - 4 hours 14400000 milliseconds
function startHungerInterval() {
	clearInterval(hungerInterval)
	hungerInterval = setInterval(checkIfHungry, 14400000)
}

//check jIsHungry variable
function checkIfHungry(){
	//runs after interval.
	//J can be hungry even if he is asleep.
	//If J is asleep, let's not send alerts to Discord

	//set jIsHungry to true
	jIsHungry = true
	console.log(`4 hours have past and J is hungry.`)

	//tell all clients J is hungry
	io.emit('state-hungry', {message: 'Server: J is hungry.', state:'true'})
	
	//update all clients with new gif array
	updateClientGifs()

	if(hungerMessageSentOnce === false){	
		//disabled webhook messaging while testing		
		if(jIsAsleep === false ){
			hungerMessageSentOnce = true
			sendDiscordMessage(hungerMessage, hungerGif, "Hungry")
		}
	}
}
////////////////////////////////////////////////////////////////////
 


///////////////////////////SLEEP EVENTS////////////////////////////
startSleepInterval()

//check every minute if J is sleepy
//every 61 minutes = 3660000
function startSleepInterval() {
	setInterval(checkIfSleepy, 15000)
}

//check if J is sleepy
//utc. 0 = 8pm ET, 10 6am et
function checkIfSleepy(){
	var t = new Date()
	var currentTime = t.getUTCHours()
	if(currentTime > 0 && currentTime < 12){
		console.log(`On the server: J is tired.  Please turn off the lights.`)
		jIsSleepy = true

		//update the client if they were already connected that J is sleepy.  If jIsAsleep = false,
		//no one has put J to sleep and the clients should be told until he is.
		if(jIsAsleep === false) {
			io.emit('state-sleepy', {message : "Server: J is tired.", state: 'true'})
		}
		//send sleep discord message once and update client once.
		if (sleepyMessageSentOnce === false) {	
			sendDiscordMessage(sleepMessage,sleepyGif, "Sleepy")
			sleepyMessageSentOnce = true
		}		  
	}
	else {
		// J should awake on his own and the sleepyMessageSentOnce should be false to reset it for the evening.
		console.log(`${Date.now} --- J should be awake.`)
		jIsSleepy = false
		jIsAsleep = false
		io.emit('state-sleepy', {message: "It's worktime.", state: 'false'})
		sleepyMessageSentOnce = false
	}
	//send gifs
	updateClientGifs()
}

	////////////////////////////Gif Management////////////////////////////////////////
	function updateClientGifs() {
		gifsToClient = []

		if(jIsAsleep === true) {
			gifsToClient.push(asleepGif)
			io.emit('update-all-clients-gifs', {gifs:gifsToClient})
			return
		}
		if(jIsSleepy === true) {
			gifsToClient.push(sleepyGif)
		}
		if(jIsHungry === true) {
			gifsToClient.push(hungerGif)
		}
		if(!jIsHungry && !jIsAsleep && !jIsSleepy) {
			gifsToClient = []
			gifsToClient.push(idleGif)
		}

		console.log(`SERVER: GifsToClient = ${chalk.red(gifsToClient)}`)
		io.emit('update-all-clients-gifs', {gifs:gifsToClient})
	}

	///////////////////////////////////////////////
////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////
//just outputting stuff I wanat to know about for testing
getTime()

function getTime() {
		setInterval(checkTime, 15000)
}

function checkTime(){
    var h = new Date()
	//logging out variables for testing
    console.log(`ET: ${h.getHours()}`)
    console.log(`UTC: ${h.getUTCHours()}`)
	console.log(`hungerMessageSentOnce: ${hungerMessageSentOnce}`)
	console.log(`sleepyMessageSentOnce: ${sleepyMessageSentOnce}`)
	console.log(`jIsHungry: ${jIsHungry} and type of `+  typeof(jIsHungry))
	console.log(`jIsSleepy: ${jIsSleepy} and type of ` + typeof(jIsSleepy))
	console.log(`jIsAsleep: ${jIsAsleep} and type of ` + typeof(jIsAsleep))
	console.log(`currentTime hours in UTC: ${currentTime}`)
	console.log(`This is what the server is sending for Gifs: ${gifsToClient}`)
}
///////////////////////////////////////////////////////////////////////