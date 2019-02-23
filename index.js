var ffmpeg = require('fluent-ffmpeg');
var path = require('path');
var fs = require('fs');
var config = require('config');
var url = require('./url');
var savepath = config.get('savepath');
var util    = require('util')

var logPath = config.get('logPath');
var logFile = fs.createWriteStream(logPath, { flags: 'a' })

console.log = function() {
  logFile.write(util.format.apply(null, arguments) + '\n')
  process.stdout.write(util.format.apply(null, arguments) + '\n')
}

console.error = function() {
  logFile.write(util.format.apply(null, arguments) + '\n')
  process.stderr.write(util.format.apply(null, arguments) + '\n')
}
var recoding = [];
check();
async function check(){
    while(1){
        var channel =JSON.parse(fs.readFileSync(config.get('channelPath'), 'utf8'));
        for(var index in channel){
            task(index, channel[index]);
        }
        await new Promise(resolve => setTimeout(resolve, 120*1000))
    }
}

async function task(name, channel){
    try{
        var vid = await url.getVid(channel);
        var info = await url.getM3u8(vid)
        if(recoding.indexOf(name) == -1){
            recoding.push(name);
            recode(name, info, vid);
        }
        //console.log(info);
    } catch(err) {
        //console.log(err);
    }
}
async function recode(name, info, vid){
    console.log(getTime()+' 开始录制'+name)
    try{
         fs.accessSync(path.join(savepath,name));
    } catch(err) {
        fs.mkdirSync(path.join(savepath,name));
    }
    var command = ffmpeg(info[1],{ max_reload: "20"})
    .videoCodec('copy')
    .audioCodec('copy')
    .on('error', function(err) {
        if(err.message == "ffmpeg was killed with signal SIGKILL"){
            console.log(getTime()+' '+ name+':'+info[0]+'录制结束?.' + err.message);
        } else {
            console.log(getTime()+' '+name+':'+info[0]+'录制失败:' + err.message);
        }
        var index = recoding.indexOf(name);
        if (index > -1) {
            recoding.splice(index, 1);
        }
    })
    .save(path.join(savepath,name+'/'+getTime()+info[0]+'.ts'));
    while(1){
        var errorNum = 0;
        await new Promise(resolve => setTimeout(resolve, 5*1000))
        var status = await url.status(vid);
        if(status != 'ok') errorNum++;
        else errorNum = 0;
        if(status == 'live_stream_offline' || errorNum > 20){
            command.kill();
            break;
        }
    }

}

function getTime(){
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
