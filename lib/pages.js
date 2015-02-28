//dependencies
var webpage = require('webpage'),
  system = require('system'),
  async = require('async');

//parse arguments
var accounts = JSON.parse(system.args[1]),
  text = system.args[2];

var weibo_page = webpage.create(),
  twitter_page = webpage.create();

var throwErrAndExit = function(errDescription){
  if(errDescription){
    console.log("ERROR: ", errDescription);
    phantom.exit(1);
    return;
  }
};

var waterfallFuncs = {
  twitter:{
    sessionURL:'https://mobile.twitter.com/session/new',
    funcs:[
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
          cb(new Error('failed to redirect to post twitter_page'));
        };

        //redirect to "compose tweet" twitter_page
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
    ]
  },

  weibo:{
    sessionURL:"http://weibo.com/login.php",
    funcs:[    
      function(cb){
        //check login status
        weibo_page.onUrlChanged = function(){    
          //bind loadFinished event after url changed 
          //for that weibo_page will redirect to personal home weibo_page
          weibo_page.onLoadFinished = function(){          
            if(~weibo_page.content.indexOf('退出')){
              cb(null)            
              return;
            }

            cb(new Error('weibo login failed'));
          }
        };

        //login
        console.log('logining..');

        weibo_page.evaluate(function(name, secret){
          //eventFire for firing "click" event on <a>
          var eventFire = function(el, etype){
            if (el.fireEvent) {
              el.fireEvent('on' + etype);
            } else {
              var evObj = document.createEvent('Events');
              evObj.initEvent(etype, true, false);
              el.dispatchEvent(evObj);
            }
          };

          var account = document.querySelector("[node-type='username']");
          account.value = name;
          var password = document.querySelector("[node-type='password']");
          password.value = secret;
          var submitBtn = document.querySelectorAll('[node-type="submitBtn"]')[1];
          eventFire(submitBtn, 'click');          
        }, accounts.weibo.name, accounts.weibo.secret);
      },

      function(cb){
        weibo_page.onLoadFinished = function(){
          if (~weibo_page.content.indexOf(text)){
            cb();
            return;
          }

          cb(new Error('failed to submit post'));
        };

        //submit post
        console.log('submitting..');
        weibo_page.evaluate(function(text){
          var eventFire = function(el, etype){
            if (el.fireEvent) {
              el.fireEvent('on' + etype);
            } else {
              var evObj = document.createEvent('Events');
              evObj.initEvent(etype, true, false);
              el.dispatchEvent(evObj);
            }
          };

          var textarea = document.querySelector('[node-type="textEl"]');
          //get focus so that we can submit post
          eventFire(textarea, 'focus'); 
          textarea.value = text;        

          var submit = document.querySelector('[node-type="submit"]');
          eventFire(submit, 'click');
        }, text);
      }
    ]
  }
}

var submitText = function(site, page){    
  console.log('requesting..');
  page.open(encodeURI(site.sessionURL), function(status){
    if (status === 'success'){
      async.waterfall(site.funcs, function(err, result){
        if(err){
          console.log(err.message);
          throwErrAndExit('error thrown!');
          return;
        }
      });
    }else{
      throwErrAndExit('request failed!');
    }
  });
};

submitText(waterfallFuncs.twitter, twitter_page);
submitText(waterfallFuncs.weibo, weibo_page);
