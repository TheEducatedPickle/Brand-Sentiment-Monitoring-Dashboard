const path = require('path');
const express = require('express');
const Twitter = require('twitter-node-client').Twitter;
const bodyParser= require("body-parser");
const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1.js');

const naturalLanguageUnderstanding = new NaturalLanguageUnderstandingV1({
  version: '2018-11-16',
  iam_apikey: '',
  url: 'https://gateway.watsonplatform.net/natural-language-understanding/api'
});

const config = {
    'consumerKey': "",
    'consumerSecret': "",
    'accessToken': "",
    'accessTokenSecret': ""
};
const twitter = new Twitter(config);

const error = function (err, response, body) {
    console.log('ERROR [%s]', err);
};

const app = express();

app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'build')));

app.get('/twitter', function (req, res) {
    const searchResults = twitter.getSearch(
        { 'q': 'ibm', 'count': 100 }, 
        error, 
        function (data) {
            data = JSON.parse(data);
            res.send(data);
            // return res.send(statuses[0]['text']);
            // for (let i = 0; i < 100; i++) {
            //     if (statuses[i]) {
            //         console.log(statuses[i]['text']);
            //     } else {
            //         break;
            //     }
            // }
        }
    );
});

var rawjs = require('raw.js');
var reddit = new rawjs("WatsonBot");
reddit.setupOAuth2("ZweJ_5vnHiceww", "ntESUzk15C07el8yIvMzyVfFV9E");

let options = {
    q: 'IBM Cloud'
}

let out = []
let result = "";
reddit.search(options, function(err, resp) {
    for (var i = 0; i < resp.children.length; i++) {
        // out.push([resp.children[i].data.selftext, resp.children[i].data.created_utc])
        out.push(resp.children[i].data.selftext)
        //console.log(resp.children[i].data)
        //console.log(resp.children[i].data.url)
        const permurl = resp.children[i].data.permalink
        //console.log(permurl.substring(permurl.indexOf('/comments/')+10))
        let commentOptions = {
            link : permurl.substring(permurl.indexOf('/comments/')+10)
        }
        reddit.comments(commentOptions, function(err, comments) {
            if (comments) {
                const children = comments.data.children
                for (let i = 0; i < children.length; i++) {
                    if (children[i].data) {
                        // out.push([children[i].data.body, children[i].data.created_utc])
                        out.push(children[i].data.body)
                    }
                }
            }
        });
    }
    result = out.join();
});


app.post('/watson/twitter',function(req,res){
    const param = req.body.a;
    console.log("param",param);
    if (!param) {
    res.json({
      error: "Missing required parameter `q`"
    });
    return;
    }
    const parameters = {
        'text': param,
        'features': {
          'entities': {
            'sentiment': true,
            'limit': 1
          }
        }
    }

    naturalLanguageUnderstanding.analyze(parameters)
        .then(analysisResults => {
          res.send(JSON.stringify(analysisResults, null, 2));
        })
        .catch(err => {
          console.log('error:', err);
        });
})

app.post('/watson/reddit',function(req,res){
  const param = req.body.a;
  console.log("param",param);
  if (!param) {
  res.json({
    error: "Missing required parameter `q`"
  });
  return;
  }

  const runAnalysis = query => {
    const parameters = {
      'text': param,
      'features': {
        'entities': {
          'sentiment': true,
          'limit': 1
        }
      }
    };

    naturalLanguageUnderstanding.analyze(parameters)
      .then(analysisResults => {
        res.send(JSON.stringify(analysisResults, null, 2));
      })
      .catch(err => {
        console.log('error:', err);
      });
  };
})


app.get('/reddit', function(req, res) {
    res.send(result);
});


app.listen(process.env.PORT || 8080);
