if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const chalk = require("chalk");
const debug = require("debug")("app");
const morgan = require("morgan");
const path = require("path");
const flash = require("express-flash");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const http = require("http");
const socketio = require("socket.io");
const fetch = require("node-fetch");

const PORT = process.env.PORT || 3000;
const app = express();

//configuring socket.io
const server = http.createServer(app);
const io = socketio(server);

//routes pages
const authRouter = require("./src/routers/authRouter");
const virtaulJRouter = require("./src/routers/virtualJRouter");
const { emit } = require("process");
const { setInterval } = require("timers");
const { Console } = require("console");
const { SSL_OP_NO_TICKET } = require("constants");

//morgan monitors web traffic. options are tiny or combined
app.use(morgan("tiny"));
app.use(express.static(path.join(__dirname, "/public/")));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
require("./src/config/passport.js")(app);

app.set("view engine", "ejs");
app.set("views", "./src/views");

app.use(flash());

app.use(function (req, res, next) {
  res.locals.duplicate_email_error = req.flash("duplicate_email_error");
  res.locals.login_error = req.flash("login_error");
  next();
});

app.use("/auth", authRouter);
app.use("/virtual-j", virtaulJRouter);

//chalk is just an easy way to color text
//set debug=* & node app.js will debug all packages. debug=app & node app.js will debug just app
//server.listen is required now instead of app.listen.  server has the websocket attached now and not app
server.listen(PORT, () => debug(`I'm listening on port ${chalk.green(PORT)}`));

app.get("/", (req, res) => {
  res.render("index", { name: "Welcome to Kung Fu J!" });
});

//https://http.cat/
app.get("*", function (req, res) {
  res.redirect("https://http.cat/404");
});

////////////////////Socket.io///////////////////
io.on("connection", function (socket) {
  console.log("New Connection Made");

  updateClientGifs();
  ///////////////////////SET CLIENT STATE AT CONNECTION////////////////////////
  if (jIsHungry === true) {
    //changed to io.sockets.emit from socket.emit so every connection knows J is hungry
    io.sockets.emit("state-hungry", {
      message: "Server On Connection: j is hungry",
      state: "true",
    });
  }
  ///if j is sleep but not asleep.
  if (jIsSleepy === true && jIsAsleep === false) {
    io.sockets.emit("state-sleepy", {
      message: "Server On Connection: J is sleepy",
      state: "true",
    });
  }
  //if j is asleep and a new connection is made, show him asleep but not sleepy
  if (jIsAsleep === true) {
    io.sockets.emit("update-all-clients-sleep", {
      message: "Server On Connection: J is sleepy",
    });
  }

  ////////////////////////////////////////////////////////////////////

  ///////////////////////////HUNGRY EVENTS////////////////////////////
  socket.on("action-fed", function (msg) {
    //can't feed J if he is a asleep
    if (jIsHungry === true && jIsAsleep === true) {
      socket.emit("jIsAsleep", {
        message: "Server: J is asleep and cannot eat.",
        state: "true",
      });
      console.log(`jIsHungry: ${jIsHungry} and jIsAsleep: ${jIsAsleep}`);
      return;
    }
    //j is hungry and not asleep, we can feed him
    if (jIsHungry === true && jIsAsleep === false) {
      console.log(`jIsHungry: ${jIsHungry} and jIsAsleep: ${jIsAsleep}`);
      //need to tell all clients J has been fed by updating the class on f
      io.sockets.emit("update-all-clients-fed", "Server: a-client-fed-j");

      jIsHungry = false;
      hungerMessageSentOnce = false;

      updateClientGifs();
      return;
    }
    //if j is not hungry and asleep, we cannot feed him because he is asleep.
    if (jIsHungry === false && jIsAsleep === true) {
      //assuming last condition is jIsHungry = false, so we cannot feed him.
      //Tell client j isn't hungry.
      console.log(`J isn't hungry.`);
      socket.emit("state-hungry", {
        message: "Server: J is asleep.",
        state: "false",
      });
      console.log(`jIsHungry: ${jIsHungry}`);
      return;
    }
    if (jIsHungry === false) {
      //assuming last condition is jIsHungry = false, so we cannot feed him.
      //Tell client j isn't hungry.
      console.log(`J isn't hungry.`);
      //tell single client who sent the request J is not hungry.
      socket.emit("state-hungry", {
        message: "Server: J isn't hungry.",
        state: "false",
      });
      console.log(`jIsHungry: ${jIsHungry}`);
      return;
    }
  });

  ///////////////////////////SLEEP EVENTS////////////////////////////
  //if a client put J to sleep, change variable to false
  socket.on("action-sleep", function (msg) {
    //If J is asleep, we cannot make him asleep again
    if (jIsAsleep === true) {
      console.log(`J is asleep and can't be put to sleep`);
      socket.emit("state-sleepy", {
        message: "Server: J is already asleep.",
        state: "alreadyAsleep",
      });
      return;
    }
    //if J is sleepy but not asleep, we can put him to sleep
    if (jIsSleepy === true && jIsAsleep === false) {
      console.log(`Client put J to sleep and returned: ${msg}`);
      //need to tell all clients J has been fed by updating the class on f
      io.sockets.emit("update-all-clients-sleep", {
        message: "Server: a-client-sleep-j",
        state: "true",
      });
      jIsSleepy = false;
      jIsAsleep = true;
      updateClientGifs();
      return;
    } else {
      console.log(`J isn't sleepy.`);
      socket.emit("state-sleepy", {
        message: "Server: J isn't sleepy.",
        state: "jIsntSleepy",
      });
      return;
    }
  });
});
////////////////////////////////////////////////////////////////////

stateTimesSet = false;
discordHook = process.env.DISCORD_HOOK;
link = process.env.localhost || "https://virtual-j.herokuapp.com";

//hunger
hungerMessage = `J is hungry.  Please feed him. :drooling_face: [Virtual-j](${link})`;
hungerMessageSentOnce = false;
var jIsHungry = false;

//sleep
sleepMessage = `J is sleepy. Please make him go to bed. :yawning_face: [Virtual-j](${link})`;
sleepyMessageSentOnce = false;
jIsSleepy = false;
jIsAsleep = false;

//lazy
lazyMessage = `J is being lazy. Please make him exercise. :weary: [Virtual-j](${link})`;
lazyMessageSentOnce = false;
jIsLazy = false;

//gifs
const hungerGif =
  "https://github.com/MeganFuhr/BingaGifs/blob/main/JGifs/J-HUNGRY-CHIBI-02.gif?raw=true";
const sleepyGif =
  "https://github.com/MeganFuhr/BingaGifs/blob/main/JGifs/J-SLEEPY-CHIBI-02.gif?raw=true";
const asleepGif =
  "https://github.com/MeganFuhr/BingaGifs/blob/main/JGifs/J-ASLEEP-CHIBI-06.gif?raw=true";
const eatingGif =
  "https://github.com/MeganFuhr/BingaGifs/blob/main/JGifs/J-EATING-CHIBI-02.gif?raw=true";
const idleGif =
  "https://github.com/MeganFuhr/BingaGifs/blob/main/JGifs/J-IDlE-CHIBI-01.gif?raw=true";
const lazyGif =
  "https://github.com/MeganFuhr/BingaGifs/blob/main/JGifs/J-LAZY-CHIBI-01.gif?raw=true";

var gifsToClient = [];

//send discord message
function sendDiscordMessage(message, gif, state) {
  const msg = {
    username: "ZilloBot",
    avatar_url:
      "https://raw.githubusercontent.com/MeganFuhr/BingaGifs/main/j5.png",
    embeds: [
      {
        author: {
          name: "ZilloBot",
          url: link,
          icon_url:
            "https://raw.githubusercontent.com/MeganFuhr/BingaGifs/main/j5.png",
        },
        title: state,
        url: link,
        description: message,
        color: 15258703,
        thumbnail: {
          url: gif,
        },
      },
    ],
  };
  fetch(discordHook + "?wait=true", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(msg),
  })
    .then((res) => res.json())
    .then(console.log);
}

////////interval checker for all states. takes a function.////////
function startStateCheckInterval(stateChecker) {
  setInterval(stateChecker, 50000);
}

////////Gif Management////////
function updateClientGifs() {
  gifsToClient = [];

  if (jIsAsleep === true) {
    gifsToClient.push(asleepGif);
    io.sockets.emit("update-all-clients-gifs", { gifs: gifsToClient });
    return;
  }
  if (jIsSleepy === true) {
    gifsToClient.push(sleepyGif);
  }
  if (jIsHungry === true) {
    gifsToClient.push(hungerGif);
  }
  if (!jIsHungry && !jIsAsleep && !jIsSleepy && !jIsLazy) {
    gifsToClient = [];
    gifsToClient.push(idleGif);
  }
  if ((jIsLazy = true)) {
    gifsToClient.push(lazyGif);
  }

  console.log(`SERVER: GifsToClient = ${chalk.red(gifsToClient)}`);
  io.sockets.emit("update-all-clients-gifs", { gifs: gifsToClient });
}
////////////////////////////////////////////////////////////////////

///////////////////////////SLEEP EVENTS////////////////////////////
startStateCheckInterval(checkIfSleepy);

//check if J is sleepy
function checkIfSleepy() {
  var t = new Date();
  var currentTime = t.getUTCHours();
  if (currentTime > 0 && currentTime < 10) {
    console.log(`On the server: J is tired.  Please turn off the lights.`);
    jIsSleepy = true;

    //update the client if they were already connected that J is sleepy.  If jIsAsleep = false,
    //no one has put J to sleep and the clients should be told until he is.
    if (jIsAsleep === false) {
      io.sockets.emit("state-sleepy", {
        message: "Server: J is tired.",
        state: "true",
      });
      //send gifs
      updateClientGifs();
    }
    //send sleep discord message once and update client once.
    if (sleepyMessageSentOnce === false) {
      sendDiscordMessage(sleepMessage, sleepyGif, "Sleepy");
      sleepyMessageSentOnce = true;
    }
  } else {
    // J should awake on his own and the sleepyMessageSentOnce should be false to reset it for the evening.
    jIsSleepy = false;
    jIsAsleep = false;
    io.sockets.emit("state-sleepy", {
      message: "It's worktime.",
      state: "false",
    });
    sleepyMessageSentOnce = false;
  }
}
////////////////////////////////////////////////////////////////////

//////////////////////////////////LAZY///////////////////////////////
startStateCheckInterval(checkIfLazy);

function checkIfLazy() {
  var time = getCurrentTime();
  time = time.toTimeString();

  if (time == stateTimes.lazy) {
    toClient_JLazy();
  }
}

function toClient_JLazy() {
  console.log(`J is lazy.`);

  jIsLazy = true;

  //tell all clients J is lazy
  io.sockets.emit("state-lazy", {
    message: "Server: J is lazy.",
    state: "true",
  });

  //update all clients with new gif array
  updateClientGifs();

  if (lazyMessageSentOnce === false) {
    //disabled webhook messaging while testing
    if (jIsAsleep === false) {
      lazyMessageSentOnce = true;
      sendDiscordMessage(lazyMessage, lazyGif, "Lazy");
    }
  }
}

//////////////////////////////////HUNGER///////////////////////////////
startStateCheckInterval(checkIfHungry);

const stateTimes = runOnceAtStart();

function getCurrentTime() {
  var time = new Date();
  time.setSeconds(0);
  return time;
}

function checkIfHungry() {
  var time = getCurrentTime();
  time = time.toTimeString();

  //CHeck the time against set state times.
  if (time == stateTimes.breakfast) {
    toClient_JHungry();
  }
  if (time == stateTimes.lunch) {
    toClient_JHungry();
  }
  if (time == stateTimes.dinner) {
    toClient_JHungry();
  }
}

/////////////////////Get state times for the day/////////////////////////////
function runOnceAtStart() {
  if (stateTimesSet === false) {
    stateTimesSet = true;
    return setStateTimes();
  }
}

function getRandomMinute() {
  return Math.round(Math.random() * (60 - 1) + 1);
}

function setStateTimes() {
  var breakfast = new Date();
  var lunch = new Date();
  var dinner = new Date();
  var lazy = new Date();

  breakfast = breakfast.setUTCHours(12, getRandomMinute(), 0);
  lunch = lunch.setUTCHours(16, getRandomMinute(), 0);
  dinner = dinner.setUTCHours(22, getRandomMinute(), 0);
  lazy = lazy.setUTCHours(12, getRandomMinute(), 0);

  breakfast = new Date(breakfast);
  lunch = new Date(lunch);
  dinner = new Date(dinner);
  lazy = new Date(lazy);

  return {
    breakfast: breakfast.toTimeString(),
    lunch: lunch.toTimeString(),
    dinner: dinner.toTimeString(),
    lazy: lazy.toTimeString(),
  };
}
/////////////////////Tell the client J is hungry/////////////////////////////
function toClient_JHungry() {
  console.log(`J is hungry by new method.`);

  jIsHungry = true;

  //tell all clients J is hungry
  io.sockets.emit("state-hungry", {
    message: "Server: J is hungry.",
    state: "true",
  });

  //update all clients with new gif array
  updateClientGifs();

  if (hungerMessageSentOnce === false) {
    //disabled webhook messaging while testing
    if (jIsAsleep === false) {
      hungerMessageSentOnce = true;
      sendDiscordMessage(hungerMessage, hungerGif, "Hungry");
    }
  }
}

///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////
//just outputting stuff I wanat to know about for testing
getTime();

function getTime() {
  setInterval(checkTime, 15000);
}

function checkTime() {
  var h = new Date();
  //logging out variables for testing
  console.log(`ET: ${h.getHours()}`);
  console.log(`UTC: ${h.getUTCHours()}`);
  console.log(`hungerMessageSentOnce: ${hungerMessageSentOnce}`);
  console.log(`sleepyMessageSentOnce: ${sleepyMessageSentOnce}`);
  console.log(`jIsHungry: ${jIsHungry} and type of ` + typeof jIsHungry);
  console.log(`jIsSleepy: ${jIsSleepy} and type of ` + typeof jIsSleepy);
  console.log(`jIsAsleep: ${jIsAsleep} and type of ` + typeof jIsAsleep);
  console.log(`This is what the server is sending for Gifs: ${gifsToClient}`);
  console.log(
    `Meal Times: ${stateTimes.breakfast} and type of ` +
      typeof stateTimes.breakfast
  );
  console.log(
    `Breakfast Time: ${stateTimes.lunch} and type of ` + typeof stateTimes.lunch
  );
  console.log(
    `Lunch Time: ${stateTimes.dinner} and type of ` + typeof stateTimes.dinner
  );
  console.log(
    `Dinner Time: ${stateTimes.dinner} and type of ` + typeof stateTimes.dinner
  );
  console.log(
    `Lazy Time: ${stateTimes.lazy} and type of ` + typeof stateTimes.lazy
  );
}
