const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
require("dotenv").config();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { TwitterApi } = require("twitter-api-v2");
const User = require("./user.model");
const auth = require("./auth.middleware");
const cors = require("cors");
const CONSUMER_KEY = process.env.TWITTER_API_KEY;
const CONSUMER_SECRET = process.env.TWITTER_API_KEY_SECRET;

app.use(cors());
app.use(cookieParser());
app.use(express.json())


app.use((req,res,next)=>{
    console.log("request handled", req.path);
    next();
})

const appClient = new TwitterApi({ appKey: CONSUMER_KEY, appSecret: CONSUMER_SECRET });

app.get("/me", auth, (req, res) => {
    res.json({ user: req.user })
})
app.get("/likes", auth, async (req, res) => {
    try {
        let user = req.user;
        console.log("user", user);

        // OAuth 1.0a User Context için Twitter API istemcisini oluşturma
        let client = new TwitterApi({
            appKey: CONSUMER_KEY,
            appSecret: CONSUMER_SECRET,
            accessToken: user.twitterAccessToken,
            accessSecret: user.twitterAccessSecret,
        });

        let me = await client.v2.me()
        console.log("me", me);
        let tweets = await client.v2.userLikedTweets(me.data.id)
        res.json({ tweets })
    } catch (error) {
        console.log("error", error);
        res.json({ error })
    }
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        let user = await User.findOne({ username: username, password: password })
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        let token = jwt.sign({ user: user.toJSON() }, process.env.JWT_SECRET, { expiresIn: "1h" });
        return res.json({ user, token })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

app.post("/register", async (req, res) => {
    console.log("register", req.body)
    const { username, password } = req.body;
    try {
        let user = await User.create({ username, password });
        let token = jwt.sign({ user: user.toJSON() }, process.env.JWT_SECRET, { expiresIn: "1h" });
        return res.json({ user, token })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Internal server error" });
    }
});


app.get("/connect", auth, async (req, res) => {
    const authLink = await appClient.generateAuthLink(`${process.env.API_URL}/user/twitter/callback`, { linkMode: 'authorize' });
    // By default, oauth/authenticate are used for auth links, you can change with linkMode
    // Use URL generated
    await User.findOneAndUpdate({ username: req.user.username }, {
        oauth_token: authLink.oauth_token,
        oauth_token_secret: authLink.oauth_token_secret
    })

    res.json({ authLink });
})

app.get("/disconnect", auth, async (req, res) => {
    await User.findOneAndUpdate({ username: req.user.username }, {
        twitterAccessSecret: null,
        twitterAccessToken: null
    })
    res.json({ success: true });
})

app.get('/user/twitter/callback', async (req, res) => {
    // Extract tokens from query string
    const { oauth_token, oauth_verifier } = req.query;
    // Get the saved oauth_token_secret from session
    let user = await User.findOne({ oauth_token: oauth_token })
    let oauth_token_secret = user.oauth_token_secret

    if (!oauth_token || !oauth_verifier || !oauth_token_secret) {
        return res.status(400).send('You denied the app or your session expired!');
    }

    // Obtain the persistent tokens
    // Create a client from temporary tokens
    const client = new TwitterApi({
        appKey: CONSUMER_KEY,
        appSecret: CONSUMER_SECRET,
        accessToken: oauth_token,
        accessSecret: oauth_token_secret,
    });

    client.login(oauth_verifier)
        .then(async ({ client: loggedClient, accessToken, accessSecret }) => {
            // loggedClient is an authenticated client in behalf of some user
            // Store accessToken & accessSecret somewhere

            await User.findOneAndUpdate({ oauth_token: oauth_token }, {
                twitterAccessToken: accessToken,
                twitterAccessSecret: accessSecret,
                oauth_token: null,
                oauth_token_secret: null
            })

            res.redirect("http://localhost:3001")
        })
        .catch(() => res.status(403).send('Invalid verifier or access tokens!'));
});



mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log("Connected to MongoDB");
    app.listen(process.env.PORT || 3000, () => {
        console.log("Server running on port 3000");
    });
}).catch((err) => {
    console.log("Error connecting to MongoDB");
    console.log(err);
});


module.exports = app;
