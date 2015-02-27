//dependencies
var webpage = require('webpage'),
  system = require('system'),
  async = require('async');

// parse arguments
var accounts = JSON.parse(system.args[1]);

//create pages of webbo and twitter
var twitter_page = webpage.create(),
  weibo_page = webpage.create();

console.log('requesting..');

twitter_page.open(encodeURI('http://twitter.com'), function(status){
  if (status === 'success'){
    console.log('index page loaded, filling form');    
    console.log(twitter_page.content);

    async.waterfall([      
      function(cb){
        //fill the form and login
        twitter_page.evaluate(function(){
          var form = document.querySelectorAll('.signin')[1];
          form.querySelector('#signin-email').value(accounts.twitter.name);
          form.querySelector('#signin-password').value(accounts.twitter.secret);
          form.querySelector('.submit').click();
          cb();
        });
      },

      function(cb){

      }
    ], function(err, result){
      console.log(page.content);
    });    
  }else{
    console.log('request failed!');      
  }

  twitter_page.close();  

  phantom.exit();
});