//dependencies
var fs = require('fs');
var childProcess = require('child_process');
var phantomjsPath = require('phantomjs').path;
var pagesScript = __dirname+'/lib/pages.js';

//get option file
var option = JSON.parse(fs.readFileSync('option.json', 'utf8'));

//spawn phantomjs
var phantomjsArgs = [pagesScript, JSON.stringify(option.accounts)];

var phantomjsProc = childProcess.spawn(phantomjsPath, phantomjsArgs);

//handle messages
phantomjsProc.stdout.on('data', function(data){
  console.log('stdout: '+data);
});

phantomjsProc.stdout.on('close', function(code){
  console.log('exit with: '+code);
});

// send test string
var test_string = '测试测试';
