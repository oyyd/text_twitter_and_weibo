//dependencies
var fs = require('fs');
var childProcess = require('child_process');
var phantomjsPath = require('phantomjs').path;
var pagesScript = __dirname+'/lib/pages.js';

var test_string = '测试测试';

//get option file
var option = JSON.parse(fs.readFileSync('option.json', 'utf8'));

//spawn phantomjs and send test string
var phantomjsArgs = [
  pagesScript, 
  JSON.stringify(option.accounts),
  test_string, 
];

var phantomjsProc = childProcess.spawn(phantomjsPath, phantomjsArgs);

var message = "";

//handle message
phantomjsProc.stdout.on('data', function(data){
  message += data;
  console.log('stdout: '+data);
});

phantomjsProc.stdout.on('close', function(code){
  fs.writeFileSync('result.txt', message);
  console.log('exit with: '+code);
});