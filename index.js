const path = require('path');
const fs = require('fs');
const config = require('config');
const url = require('./url');
const util    = require('util')
const { exec } = require('child_process');

//get config
let savepath = config.get('savepath');
let logPath = config.get('logPath');
let waitTime = config.get('waitTime');
//set log file
let logFile = fs.createWriteStream(logPath+'log.txt', { flags: 'a' })
let slogFile = fs.createWriteStream(logPath+'slog.txt', { flags: 'a' })
let errorFile = fs.createWriteStream(logPath+'error.txt', { flags: 'a' })
console.log = function() {
  logFile.write(util.format.apply(null, arguments) + '\n')
  process.stdout.write(util.format.apply(null, arguments) + '\n')
}

console.error = function() {
  errorFile.write(util.format.apply(null, arguments) + '\n')
  //process.stderr.write(util.format.apply(null, arguments) + '\n')
}
console.slog = function() {
  slogFile.write(util.format.apply(null, arguments) + '\n')
}

var recoding = [];

let check  = async function(){
    while(1){
        //get channel list
        let channel = JSON.parse(fs.readFileSync(config.get('channel'), 'utf8'));
        for(var index in channel){
            checkStatus(index, channel[index]);
        }
        //wait
        await new Promise(resolve => setTimeout(resolve, waitTime*1000))
    }
}

let checkStatus = async function(name, channel){
    try{
        if(recoding.indexOf(name) == -1){
            let info = await url.getInfo(channel);
            let hb = await url.hb(info.vid);
            //console.log(hb.status);
            if(hb.status == "ok"){
                recoding.push(name);
                recode(name, info.title, info.vid);
            }
        }
    } catch(err){
        console.log(err);
    }
}

let recode = async function(name, info, vid){
    console.log(`${getTime()} 开始录制 (${vid}) ${name} ${info}`);
    try{
         fs.accessSync(path.join(savepath,name));
    } catch(err) {
        fs.mkdirSync(path.join(savepath,name));
    }
    let status = true;
    let task = exec(`streamlink https://www.youtube.com/watch?v=${vid} best -o "${path.join(savepath,name+'/'+getTime()+info+'.ts')}"`, (error, stdout, stderr) => {
        if(error){
            console.slog(`${getTime()} ${name}:${error}`);
        }
        console.log(`${getTime()} 录制结束 ${name} ${info}`);
        let index = recoding.indexOf(name);
        if (index > -1) {
            recoding.splice(index, 1);
        }
        status = false;
    });
    task.stdout.on('data', (data) => {
        let regExp = /\[cli\]\[(.*?)\](.*)/;
        let res = regExp.exec(data);
        if(res){
            if(res[1] == 'info') console.slog(`${getTime()} ${name}:${res[2]}`);
            if(res[1] == 'error') console.error(`${getTime()} ${name}:${res[2]}`);
        }
    });

    task.stderr.on('data', (data) => {
        console.error(`${getTime()} ${name} stderr: ${data}`);
    });

    while(1){
        if(!status) break;
        var errorNum = 0;
        await new Promise(resolve => setTimeout(resolve, 5*1000))
        var hb = await url.hb(vid);
        if(hb.status == 'live_stream_offline' && hb.reason == 'This live event has ended.'){
            task.kill('SIGKILL');
            console.log(`${getTime()} ${name} ${info} killed`);
            status = false;
        }
    }
}



let getTime = () => {
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth()+1;
    var day = date.getDate();
    var hour = date.getHours();
    var minute = date.getMinutes();
    var second = date.getSeconds();
    if (month >= 1 && month <= 9) month = "0" + month;
    if (day >= 1 && day <= 9) day = "0" + day;
    if (hour >= 0 && hour <= 9) hour = "0" + hour;
    if (minute >= 0 && minute <= 9) minute = "0" + minute;
    if (second >= 0 && second <= 9) second = "0" + second;
    return year+'-'+month+'-'+day+' '+hour+''+minute+''+second;
}


check();