/*
CSC3916 HW2
File: Server.js
Description: Web API scaffolding for Movie API
 */

var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
db = require('./db')(); //hack
var jwt = require('jsonwebtoken');
var cors = require('cors');

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

function getJSONObjectForMovieRequirement(req) {
    var json = {
        status: "0", 
        message: "No message",
        headers: "No headers",
        query: "No query",
        env: process.env.UNIQUE_KEY
    };

    if (req.body != null) {
        json.query = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

router.post('/signup', (req, res) => {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {
        var newUser = {
            username: req.body.username,
            password: req.body.password
        };

        db.save(newUser); //no duplicate checking
        res.json({success: true, msg: 'Successfully created new user.'})
    }
});

router.post('/signin', (req, res) => {
    var user = db.findOne(req.body.username);

    if (!user) {
        res.status(401).send({success: false, msg: 'Authentication failed. User not found.'});
    } else {
        if (req.body.password == user.password) {
            var userToken = { id: user.id, username: user.username };
            var token = jwt.sign(userToken, process.env.SECRET_KEY);
            res.json ({success: true, token: 'JWT ' + token});
        }
        else {
            res.status(401).send({success: false, msg: 'Authentication failed.'});
        }
    }
});


router.route('/testcollection')
    .delete(authController.isAuthenticated, (req, res) => {
        console.log(req.body);
        res = res.status(200);
        if (req.get('Content-Type')) {
            res = res.type(req.get('Content-Type'));
        }
        var o = getJSONObjectForMovieRequirement(req);
        res.json(o);
    }
    )
    .put(authJwtController.isAuthenticated, (req, res) => {
        console.log(req.body);
        res = res.status(200);
        if (req.get('Content-Type')) {
            res = res.type(req.get('Content-Type'));
        }
        var o = getJSONObjectForMovieRequirement(req);
        res.json(o);
    }
    );


router.route('/movies')
    .get((req, res) => {
        // HTTP GET Method 
        // Returns JSON object: { status: 200, message: ‘GET movies”, headers: headers: header from request, query: query string from request, env: your unique key }
        var o = getJSONObjectForMovieRequirement(req);
        o.status = 200;
        o.message = "GET movies";
        console.log(req.body);
        if (req.body.hasOwnProperty('moviename')){ // Check if GET request included specific movie name
            o.query = db.findOne(req.body.moviename); // return that movie
        }
        else { // no movie specified 
            o.query = db.findOne(); // return all movies
        }
        res.json(o);
    })
    .post((req, res) => {
        // HTTP POST Method 
        // Returns JSON object {“status”: 200, message: “movie saved”, headers: headers: header from request, query: query string from request, env: your unique key }
        db.save(req.body);
        var o = getJSONObjectForMovieRequirement(req);
        o.status = 200;
        o.message = "movie saved";
        res.json(o);
    })
    .put(authJwtController.isAuthenticated, (req, res) => {
        // HTTP PUT Method
        // Requires JWT authentication.
        // Returns a JSON object with status, message, headers, query, and env.
        console.log(req.body);
        res = res.status(200);
        if (req.get('Content-Type')) {
            res = res.type(req.get('Content-Type'));
        }
        var update = db.update(req.body.id, req.body.moviename);
        var o = getJSONObjectForMovieRequirement(req);
        o.status = 200;
        o.message = "movie updated";
        console.log(update);
        res.json(o);
    })
    .delete(authController.isAuthenticated, (req, res) => {
        // HTTP DELETE Method
        // Requires Basic authentication.
        // Returns a JSON object with status, message, headers, query, and env.
        console.log(req.body);
        res = res.status(200);
        if (req.get('Content-Type')) {
            res = res.type(req.get('Content-Type'));
        }
        var del = db.remove(req.body.id);
        var o = getJSONObjectForMovieRequirement(req);
        o.status = 200;
        o.message = "movie deleted";
        console.log(del);
        res.json(o);
    })
    .all((req, res) => {
        // Any other HTTP Method
        // Returns a message stating that the HTTP method is unsupported.
        res.status(405).send({ message: 'HTTP method not supported.' });
    });

app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only


