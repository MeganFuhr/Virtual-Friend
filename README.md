<h2> Virtual-Friend</h2>

<p>
This was an idea I felt would be a good additon to a Discord channel and a stretch project to learn web development and node.js.
</p>
<div align="center">
<img src="https://github.com/MeganFuhr/BingaGifs/blob/main/JGifs/virtual-j.gif?raw=true" alt="virtual friend" width="350" height="350"/>
</div>
 
---
<p>
This project will run a single instance of Virtual-Friend.  Meaning, every connection can help take care of a single virtual friend instead of each connection having their own virtual-friend to care for.
It was written to run on Heroku - so I took advantage of the dyno daily restarts to reset all interaction times.
</p>

---
<p>
  To begin:
  <ul>
<li>Clone the repo.</li>
<li>Create a Mongo DB atlas account.</li>
<li>Set up access to the DB.</li>
<li>Create a file at the root of the project called .env or create Vars if you plan to use Heroku.</li>
</ul>

```
SESSION_SECRET={{Your_Secret_Here}}  
MONGO_URI=mongodb+srv://{{user}}:{{password}}@{{clusterName}}.hvnro.mongodb.net?retryWrites=true&w=majority  
DISCORD_HOOK={{https://discord.com/your/webhook/uri/here}}  
DBNAME={{DB_NAME}}
SESSION_COLLECTION=((COLLECTION_NAME}}
```
<li>Update the follwoing  in virtual-j.ejs with the appropriate endpoint.</li>

```
const socket = io("https://virtual-j.herokuapp.com")
```
<li> npm start</li>
</p>


