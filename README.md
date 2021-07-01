<h2> Virtual-Friend</h2>

<p>
  This project will run a single instance of Virtual-Friend.  Meaning, every connection can help take care of a single virtual friend instead of each connection having their own virtual-friend to care for.
</p>
  
<p
To being, create a Mongo DB atlas account.

Create a file at the root of the project called .env.

Update the .env with the below contents. Be sure to replace placeholders with your own info.
</p>

```
SESSION_SECRET={{Your_Secret_Here}}  
MONGO_URI=mongodb+srv://{{user}}:{{password}}@{{clusterName}}.hvnro.mongodb.net?retryWrites=true&w=majority  
DISCORD_HOOK={{https://discord.com/your/webhook/uri/here}}  
```
