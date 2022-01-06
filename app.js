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
const MongoStore = require("connect-mongo");

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
// app.use(cookieParser());
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: true,
//     store: MongoStore.create({
//       collectionName: process.env.MONGO_URI,
//       mongoUrl: process.env.MONGO_URI,
//       collectionName: process.env.SESSION_COLLECTION,
//       dbName: process.env.DBNAME,
//       ttl: 14 * 24 * 60 * 60,
//       autoRemove: "native",
//     }),
//   })
// );
// require("./src/config/passport.js")(app);

app.set("view engine", "ejs");
app.set("views", "./src/views");

// app.use(flash());

// app.use(function (req, res, next) {
//   res.locals.duplicate_email_error = req.flash("duplicate_email_error");
//   res.locals.login_error = req.flash("login_error");
//   next();
// });

// app.use("/auth", authRouter);
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

  ///////////////////////////RAVE Initiated////////////////////////////
  socket.on("update-gifs", function (msg) {
    updateClientGifs();
  });

  updateClientGifs();
  ///////////////////////SET CLIENT STATE AT CONNECTION////////////////////////
  if (jIsHungry === true) {
    //changed to io.sockets.emit from socket.emit so every connection knows J is hungry
    io.sockets.emit("state-hungry", {
      message: "",
      state: "true",
    });
  }
  ///if j is sleep but not asleep.
  if (jIsSleepy === true && jIsAsleep === false) {
    io.sockets.emit("state-sleepy", {
      message: "",
      state: "true",
    });
  }
  //if j is asleep and a new connection is made, show him asleep but not sleepy
  if (jIsAsleep === true) {
    io.sockets.emit("update-all-clients-sleep", {
      message: "",
    });
  }
  //if j is lazy, send new connections he is lazy
  if (jIsLazy === true) {
    io.sockets.emit("state-lazy", {
      message: "",
      state: "true",
    });
  }
  //if j is bored, send new connections he is bored
  if (jIsBored === true) {
    io.sockets.emit("state-bored", {
      message: "",
      state: "true",
    });
  }

  ////////////////////////////////////////////////////////////////////

  ///////////////////////////HUNGRY EVENTS////////////////////////////
  socket.on("action-fed", function (msg) {
    //can't feed J if he is a asleep
    if (jIsHungry === true && jIsAsleep === true) {
      socket.emit("jIsAsleep", {
        message: "",
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
        message: "",
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
        message: "",
        state: "false",
      });
      console.log(`jIsHungry: ${jIsHungry}`);
      return;
    }
  });

  ///////////////////////////BORED EVENTS////////////////////////////
  socket.on("action-play", function (msg) {
    //can't feed J if he is a asleep
    if (jIsBored === true && jIsAsleep === true) {
      socket.emit("jIsAsleep", {
        message: "",
        state: "false",
      });
      return;
    }
    if (jIsBored === false && jIsAsleep === false) {
      socket.emit("state-bored", {
        message: "",
        state: "false",
      });
      return;
    }
    if (jIsBored === true && jIsAsleep === false) {
      jIsBored = false;
      boredMessageSentOnce = false;
      io.sockets.emit("update-all-clients-play", "Server: a-client-play-j");
      updateClientGifs();
      return;
    }
  });

  ///////////////////////////LAZY EVENTS////////////////////////////
  socket.on("action-lazy", function (msg) {
    //can't make J exercise if he is asleep
    if (jIsLazy === true && jIsAsleep === true) {
      socket.emit("jIsAsleep", {
        message: "",
        state: "false",
      });
      return;
    }
    if (jIsLazy === false && jIsAsleep === false) {
      socket.emit("state-lazy", {
        message: "",
        state: "false",
      });
      return;
    }
    if (jIsLazy === true && jIsAsleep === false) {
      jIsLazy = false;
      lazyMessageSentOnce = false;
      io.sockets.emit(
        "update-all-clients-exercise",
        "Server: a-client-exercised-j"
      );
      updateClientGifs();
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
        message: "",
        state: "alreadyAsleep",
      });
      return;
    }
    //if J is sleepy but not asleep, we can put him to sleep
    if (jIsSleepy === true && jIsAsleep === false) {
      console.log(`Client put J to sleep and returned: ${msg}`);
      //need to tell all clients J has been fed by updating the class on f
      io.sockets.emit("update-all-clients-sleep", {
        message: "",
        state: "true",
      });
      jIsSleepy = false;
      jIsAsleep = true;
      updateClientGifs();
      return;
    } else {
      console.log(`J isn't sleepy.`);
      socket.emit("state-sleepy", {
        message: "",
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

//bored
boredMessage = `J is bored. Please play games with him. :expressionless: [Virtual-j](${link})`;
boredMessageSentOnce = false;
jIsBored = false;

//gifs
const hungerGif =
  "https://github.com/MeganFuhr/BingaGifs/blob/main/JGifs/J-HUNGRY-CHIBI-02.gif?raw=true";
const sleepyGif =
  "https://github.com/MeganFuhr/BingaGifs/blob/main/JGifs/J-SLEEPY-CHIBI-02.gif?raw=true";
const asleepGif =
  "https://github.com/MeganFuhr/BingaGifs/blob/main/JGifs/J-ASLEEP-CHIBI-06.gif?raw=true";
const idleGif =
  "https://github.com/MeganFuhr/BingaGifs/blob/main/JGifs/J-IDlE-CHIBI-01.gif?raw=true";
const lazyGif =
  "https://github.com/MeganFuhr/BingaGifs/blob/main/JGifs/J-LAZY-CHIBI-01.gif?raw=true";
const boredGif =
  "https://github.com/MeganFuhr/BingaGifs/blob/main/JGifs/J-BORED-CHIBI-01.gif?raw=true";

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
  if (jIsBored === true) {
    gifsToClient.push(boredGif);
  }
  if (jIsLazy === true) {
    gifsToClient.push(lazyGif);
  }
  if (!jIsHungry && !jIsAsleep && !jIsSleepy && !jIsLazy && !jIsBored) {
    gifsToClient = [];
    gifsToClient.push(idleGif);
  }
  console.log(`SERVER: GifsToClient = ${chalk.red(gifsToClient)}`);
  io.sockets.emit("update-all-clients-gifs", { gifs: gifsToClient });
}
////////////////////////////////////////////////////////////////////

//////////////////////////////////BORED///////////////////////////////

function toClient_JBored() {
  console.log(`J is bored.`);

  jIsBored = true;

  //tell all clients J is lazy
  io.sockets.emit("state-bored", {
    message: "",
    state: "true",
  });

  //update all clients with new gif array
  updateClientGifs();

  if (boredMessageSentOnce === false) {
    //disabled webhook messaging while testing
    if (jIsAsleep === false) {
      boredMessageSentOnce = true;
      sendDiscordMessage(boredMessage, boredGif, "Bored");
    }
  }
}

//////////////////////////////////LAZY///////////////////////////////
function toClient_JHungry() {
  console.log(`J is hungry by new method.`);

  jIsHungry = true;

  //tell all clients J is hungry
  io.sockets.emit("state-hungry", {
    message: "",
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

///////////////////////////SLEEP EVENTS////////////////////////////
function toClient_JSleepy() {
  var time = getCurrentTime();
  var currentHour = time.getUTCHours();

  console.log(`On the server: J is tired.  Please turn off the lights.`);
  jIsSleepy = true;

  //update the client if they were already connected that J is sleepy.  If jIsAsleep = false,
  //no one has put J to sleep and the clients should be told until he is.
  if (jIsAsleep === false) {
    io.sockets.emit("state-sleepy", {
      message: "",
      state: "true",
    });
    //send gifs
    updateClientGifs();
  }
  //send sleep discord message once and update client once.
  //I want to send this message ONLY at 9pm. Dynos restart
  //and I want "quiet hours" with no messaging.
  if (sleepyMessageSentOnce === false) {
    if (currentHour == 1) {
      sendDiscordMessage(sleepMessage, sleepyGif, "Sleepy");
      sleepyMessageSentOnce = true;
    }
  }
}
//////////////////////////////////LAZY///////////////////////////////

function toClient_JLazy() {
  console.log(`J is lazy.`);

  jIsLazy = true;

  //tell all clients J is lazy
  io.sockets.emit("state-lazy", {
    message: "",
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

/////////////////////Get state times for the day/////////////////////////////
startStateCheckInterval(checkState);

const stateTimes = runOnceAtStart();

function getCurrentTime() {
  var time = new Date();
  time.setSeconds(0);
  return time;
}

function checkState() {
  var time = getCurrentTime();
  var currentHour = time.getUTCHours();
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
  if (time == stateTimes.lazy) {
    toClient_JLazy();
  }
  if (time == stateTimes.bored) {
    toClient_JBored();
  }
  if (currentHour > 0 && currentHour < 10) {
    toClient_JSleepy();
  } else {
    // J should awake on his own and the sleepyMessageSentOnce should be false to reset it for the evening.
    jIsSleepy = false;
    jIsAsleep = false;
    io.sockets.emit("state-sleepy", {
      message: "",
      state: "false",
    });
    sleepyMessageSentOnce = false;
  }
}

function runOnceAtStart() {
  if (stateTimesSet === false) {
    stateTimesSet = true;
    return setStateTimes();
  }
}

function getRandomNumber(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function setStateTimes() {
  var breakfast = new Date();
  var lunch = new Date();
  var dinner = new Date();
  var lazy = new Date();
  var bored = new Date();

  var minutes_min = 1;
  var minutes_max = 59;

  //prod 20/22
  var lazy_hours_min = 20;
  var lazy_hours_max = 22;

  //prod 21/23
  var bored_hours_min = 21;
  var bored_hours_max = 23;

  breakfast = breakfast.setUTCHours(
    12,
    getRandomNumber(minutes_min, minutes_max),
    0
  );
  lunch = lunch.setUTCHours(16, getRandomNumber(minutes_min, minutes_max), 0);
  dinner = dinner.setUTCHours(22, getRandomNumber(minutes_min, minutes_max), 0);
  lazy = lazy.setUTCHours(
    getRandomNumber(lazy_hours_min, lazy_hours_max),
    getRandomNumber(minutes_min, minutes_max),
    0
  );
  bored = bored.setUTCHours(
    getRandomNumber(bored_hours_min, bored_hours_max),
    getRandomNumber(minutes_min, minutes_max),
    0
  );

  breakfast = new Date(breakfast);
  lunch = new Date(lunch);
  dinner = new Date(dinner);
  lazy = new Date(lazy);
  bored = new Date(bored);

  return {
    breakfast: breakfast.toTimeString(),
    lunch: lunch.toTimeString(),
    dinner: dinner.toTimeString(),
    lazy: lazy.toTimeString(),
    bored: bored.toTimeString(),
  };
}

///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////
//just outputting stuff I wanat to know about for testing//
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
    `Breakfast Time: ${stateTimes.breakfast} and type of ` +
      typeof stateTimes.breakfast
  );
  console.log(
    `Lunch Time: ${stateTimes.lunch} and type of ` + typeof stateTimes.lunch
  );
  console.log(
    `Dinner Time: ${stateTimes.dinner} and type of ` + typeof stateTimes.dinner
  );
  console.log(
    `Lazy Time: ${stateTimes.lazy} and type of ` + typeof stateTimes.lazy
  );
  console.log(
    `Bored Time: ${stateTimes.bored} and type of ` + typeof stateTimes.bored
  );
}
