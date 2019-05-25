const path = require('path');
const fs = require('fs');
const config = require('config');
const util    = require('util')
const { exec } = require('child_process');

const channel = require('./channel');
const youtube = require('./youtube');

//get config
let savepath = config.get('savepath');
let logPath = config.get('logPath');
let waitTime = config.get('waitTime');
//set log file
let logFile = fs.createWriteStream(logPath+'log.txt', { flags: 'a' });
let slogFile = fs.createWriteStream(logPath+'slog.txt', { flags: 'a' });
let errorFile = fs.createWriteStream(logPath+'error.txt', { flags: 'a' });

console.log = function() {
  logFile.write(util.format.apply(null, arguments) + '\n');
  process.stdout.write(util.format.apply(null, arguments) + '\n');
}

console.error = function() {
  errorFile.write(util.format.apply(null, arguments) + '\n');
  //process.stderr.write(util.format.apply(null, arguments) + '\n');
}
console.slog = function() {
  slogFile.write(util.format.apply(null, arguments) + '\n');
}




var recoding = [];
let check  = async function(){
    while(1){
        //get channel list
        let channels = await channel.getAll();
        console.log(channels);

        for(var index in channels){
            checkStatus(channels[index]);
        }
        //wait
        await new Promise(resolve => setTimeout(resolve, waitTime*1000));
    }
}

let checkStatus = async function(vtuber){
    try{
        if(recoding.indexOf(vtuber.name) == -1){
            // youtube
            if(null != vtuber.youtube){
                let info = await youtube.getInfo(vtuber.youtube);
                console.log(info);
                let hb = await youtube.hb(info.vid);
                if(hb.status == "ok"){
                    recoding.push(vtuber.name);
                    recode(vtuber.name, 'youtube', info.title, info.vid);
                }
            }
        }
    } catch(err){
        console.log(err);
    }
}

let recode = async function(name, type, info, vid){
    console.log(`${getTime()} 开始录制 (${type}:${vid}) ${name} ${info}`);
    try{
        fs.accessSync(path.join(savepath,name));
    } catch(err) {
        fs.mkdirSync(path.join(savepath,name));
    }
    if(type != 'youtube'){
        try{
            fs.accessSync(path.join(savepath,name)+`/${type}/`);
        } catch(err) {
            fs.mkdirSync(path.join(savepath,name)+`/${type}/`);
        }
    } 
    let options = '--hls-timeout 1200 --stream-timeout 1200 --retry-streams 5 --retry-max 100000 --retry-open 500 --hls-segment-attempts 10 --hls-segment-timeout 60 --hls-timeout 600  --hls-segment-threads 3 --hls-live-edge 7 --hls-playlist-reload-attempts 10';
    let url = '';
    let filename = path.join(savepath,name+'/'+getTime()+info+'.ts');
    if(type == 'youtube'){
        url = `https://www.youtube.com/watch?v=${vid}`;
    }
    let command = `streamlink ${url} best -o "${filename}" ${options}`;
    //console.log(command);
    let task = exec(command, (error, stdout, stderr) => {
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