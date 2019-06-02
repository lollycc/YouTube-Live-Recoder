const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const channel = require('./channel');
const youtube = require('./youtube');
const config = require('./config');
const history = require('./history');

var recording = [];
var tasks = [];
let check  = async function(){
    let waitTime = await config.get('waitTime');
    while(1){
        //get channel list
        let channels = await channel.getAll();

        for(var index in channels){
            checkStatus(channels[index]);
        }
        //wait
        await new Promise(resolve => setTimeout(resolve, waitTime*1000));
        waitTime = await config.get('waitTime');
    }
}

let checkStatus = async function(vtuber){
    try{
        if(recording.indexOf(vtuber.id) == -1){
            // youtube
            if(null != vtuber.youtube){
                let info = await youtube.getInfo(vtuber.youtube);
                let hb = await youtube.hb(info.vid);
                if(hb.status == "ok"){
                    let data = await history.getLast(vtuber.id);
                    //console.log(data);
                    if(!(data && data.vid == info.vid && data.status == 1)){
                        recording.push(vtuber.id);
                        recode(vtuber.id, vtuber.name, 'youtube', info.title, info.vid);
                    }
                }
            }
        }
    } catch(err){
        console.log(err);
    }
}

let recode = async function(channelId, name, type, info, vid){
    let temppath = await config.get('tempPath');
    let savepath = await config.get('savePath');
    let startTime = Date.now();
    console.log(`${getTime()} 开始录制 (${type}:${vid}) ${name} ${info}`);
    result = await history.recordStart(channelId, type, vid, info, startTime);
    try{
        fs.accessSync(path.join(savepath,name));
    } catch(err) {
        fs.mkdirSync(path.join(savepath,name));
    }
    try{
        fs.accessSync(path.join(temppath,name));
    } catch(err) {
        fs.mkdirSync(path.join(temppath,name));
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
    let tempFilename = path.join(temppath,name+'/'+getTime()+info+'.ts');
    let filename = path.join(savepath,name+'/'+getTime()+info+'.ts');
    if(type == 'youtube'){
        url = `https://www.youtube.com/watch?v=${vid}`;
    }
    let command = `streamlink ${url} best -o "${tempFilename}" ${options}`;
    //console.log(command);
    tasks[channelId] = exec(command, (error, stdout, stderr) => {
        if(error){
            console.slog(`${getTime()} ${name}:${error}`);
        }
        console.log(`${getTime()} 录制结束 ${name} ${info}`);
        history.recordEnd(channelId, startTime);
        fs.rename(tempFilename, filename, (err)=>{
            if(err){
                console.error(err);
            }
        });
        let index = recording.indexOf(channelId);
        if (index > -1) {
            recording.splice(index, 1);
        }
    });

    
    let status = true;
    while(1){
        if(!status) break;
        await new Promise(resolve => setTimeout(resolve, 5*1000))
        var hb = await youtube.hb(vid);
        if(hb.status == 'live_stream_offline' && hb.reason == 'This live event has ended.'){
            tasks[channelId].kill();
            status = false;
        }
    }
}

let stop = async function(channelId) {
    let data = await history.getLast(channelId);
    let r = [];
    if(data){
        if(tasks[channelId]){
            tasks[channelId].kill();
            let status = history.setStopSign(channelId, data.start_time);
            return {'status':'ok'};
            return r;
        }
    }
    return {'status':'error'};
}
let getRecording = ()=>{return recording;}
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


module.exports = {
    check, checkStatus, recode, stop, getRecording
}