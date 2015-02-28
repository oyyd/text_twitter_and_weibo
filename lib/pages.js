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

twitter_page.open(encodeURI('https://mobile.twitter.com/session/new'), function(status){
  if (status === 'success'){
    async.waterfall([      
      function(cb){
        console.log('login page loaded, logining..');
        //event to detect the login status and continue next step
        twitter_page.onLoadFinished = function(status){
          //check login status
          if(~twitter_page.content.indexOf('/compose/tweet')){
            cb(null);
            return;
          }

          cb(new Error('login failed'));
        };

        //fill the form and login
        twitter_page.evaluate(function(name, secret){                   
          var nameInput = document.getElementById("session[username_or_email]");
          nameInput.value = name;
          var secretInput = document.getElementById("session[password]");
          secretInput.value = secret;
          var submitBtn = document.getElementsByName("commit")[0];
          submitBtn.click();
        }, accounts.twitter.name, accounts.twitter.secret);
      },

      function(cb){
        console.log('redirecting..');
        twitter_page.onLoadFinished = function(){
          if(~twitter_page.content.indexOf('tweet[text]')){
            cb(null);
            return;
          }
          cb(new Error('failed to redirect to post page'));
        };

        //redirect to "compose tweet" page
        twitter_page.open('https://mobile.twitter.com/compose/tweet');
      },

      function(cb){
        console.log('submiting text..');
        twitter_page.onLoadFinished = function(status){
          //check message status
          if(~twitter_page.content.indexOf(text)){
            cb(null);
            return;
          }

          cb(new Error('message posting failed'));
        };

        twitter_page.evaluate(function(text){
          //fill form and submit
          var textarea = document.getElementsByName("tweet[text]")[0];
          textarea.value = text;

          //rather ugly here
          var submitBtn = document.querySelector('[name="commit"]');

          submitBtn.click();
        }, text);
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