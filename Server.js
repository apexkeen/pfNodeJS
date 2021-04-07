    var express = require('express'),
    http = require('http'), 
    request = require('request'),
    bodyParser = require('body-parser'),
   
    app = express();

	
var https = require('https');
var fs = require('fs');
var nforce = require('nforce');
var pg = require("pg");
var jsforce = require("jsforce");
 
	
var logFmt = require("logfmt");
const { isBuffer } = require('util');

app.use(express.static(__dirname + '/client')); 

app.use(bodyParser.json());  

app.set('view engine', 'hbs');

app.set('port', process.env.PORT || 8080);

var oauth;


var org = nforce.createConnection({
    loginUrl:"login.salesforce.com",
    clientId: '3MVG9HxRZv05HarR8ZOS03xrgahNv6iAUgt3n_QvhOk3tmnFEGa0_9_odphvjIN3jJaVipfn3.NOT4J3mQnbd',
    clientSecret: '4C11300C45110F15D0462FB203FF351ACBC47F3845BF183452B54F1A3C592B5C',
    //redirectUri: 'http://localhost:8080/auth/sfdc/callback',
    redirectUri: 'https://pfeventswithnode.herokuapp.com/auth/sfdc/callback',
    apiVersion: 'v43.0',  // optional, defaults to current salesforce API version
    environment: 'production',  // optional, salesforce 'sandbox' or 'production', production default
    mode: 'multi' // optional, 'single' or 'multi' user mode, multi default
  });

  app.get('/auth/sfdc', function(req,res){
    res.redirect(org.getAuthUri());
  });

app.get('/auth/sfdc/callback', function(req, res) {
    console.log('** I am In**');
    var event_values;
    org.authenticate({code: req.query.code}, function(err, resp){
      if(!err) {
        console.log('Access Token: ' + resp.access_token);
        oauth = resp;
        var conn = new jsforce.connection({oauth2:oauth});  
        var code  = req.param('code');
        conn.authorize(code, function(err, userinfo){
          if (err) {return console.error(err);}

          conn.streaming.topic("/event/leadInfo__e").subscribe(function(message){
            console.dir(message);
            event_values = [message.event.replayId, message.payload];
            console.log('event_values', event_values);
          })

        })
        
        res.render('final',{
          appVar: event_values
        });
      } else {
        console.log('Error: ' + err.message);
      }
    });
  });
 
app.get('/' ,  function(req,res) {
    res.sendfile('views/index.html');
} ); 

app.get('/index*' ,  function(req,res) {
    res.sendfile('views/index.html');
} );  
  

app.get('/Main*' ,   function(req,res) {
    res.sendfile('views/Main.html');
} );
 

app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});

	var options = {
      key: fs.readFileSync('./key.pem', 'utf8'),
      cert: fs.readFileSync('./server.crt', 'utf8')
   };
   
	https.createServer(options, app).listen(8081);
	console.log("Server listening for HTTPS connections on port ", 8081);