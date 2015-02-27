//dependencies
var webpage = require('webpage'),
  system = require('system'),
  async = require('async');

// parse arguments
var accounts = JSON.parse(system.args[1]),
  text = system.args[2];

//create pages of webbo and twitter
var twitter_page = webpage.create(),
  weibo_page = webpage.create();

console.log('requesting..');

var throwErrAndExit = function(errDescription){
  if(errDescription){
    console.log("ERROR: ", errDescription);
    phantom.exit(1);
  }

  phantom.exit(0);
};

twitter_page.open(encodeURI('http://twitter.com'), function(status){
  if (status === 'success'){
    async.waterfall([      
      function(cb){
        console.log('index page loaded, logining..');
        //event to detect the login status and continue next step
        twitter_page.onLoadFinished = function(status){
          //check login status          
          if(~twitter_page.content.indexOf('global-new-tweet-button')){
            cb(null);
            return;
          }

          cb(new Error('login failed'));
        };

        //fill the form and login
        twitter_page.evaluate(function(name, secret){
          var form = document.querySelectorAll('.signin')[1];
          form.querySelector('#signin-email').value = name;
          form.querySelector('#signin-password').value = secret;
          form.querySelector('.submit').click();
        }, accounts.twitter.name, accounts.twitter.secret);
      },

      function(cb){        
        console.log('submiting text..');
        twitter_page.onLoadFinished = function(status){
          //check message status
          if(~twitter_page.content.indexOf(text)){
            cb(null);
            return;
          }

          cb(new Error('message post failed'));
        };

        twitter_page.evaluate(function(text){
          //fill form and submit
          var textDiv = document.querySelector('#tweet-box-mini-home-profile');
          textDiv.innerHTML = text;

          console.log(textDiv);

          //rather ugly here
          var submitBtn = textDiv
            .parentElement
            .parentElement
            .querySelector('.tweet-action');

          console.log(submitBtn);

          submitBtn.click();
        }, text);
      },

      function(cb){
        cb();
      }
    ], function(err, result){
      if(err){
        console.log(err.message);
        throwErrAndExit('error thrown!');
        return;
      }

      throwErrAndExit();
    });    
  }else{
    throwErrAndExit('request failed!');
  }

});