const rp = require('request-promise');
const fs = require('fs');
let ips = fs.readFileSync('./config/ips.txt', 'utf8').split(/[(\r\n)\r\n]+/);
let items = [];
let getItems = (obj) => {
    for(let i in obj){
        if(i == 'items'){
            for(let j in obj[i]){
                items.push(obj[i][j]);
            }
        } else if(typeof obj[i] === "object"){
            getItems(obj[i]);
        }
    }
}
let getInfo = (channel) => {
    let ip = ips[Math.round(Math.random() * (ips.length-1))];
    let options = {
        uri: 'https://'+ip+'/channel/'+channel,
        headers: {
            'Host': 'www.youtube.com',
            'accept-language': 'en-US,en;',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.109 Safari/537.36'
        }
    };
    return new Promise((resolve, reject) => {
        rp(options).then((htmlString) => {
            let regExp = /window\["ytInitialData"\] =(.*);/;
            let res = regExp.exec(htmlString);
            let data = JSON.parse(res[1]);
            items = [];
            getItems(data);
            for(let i in items){
                if(items[i].videoRenderer){
                    if(items[i].videoRenderer.badges){
                        if(items[i].videoRenderer.badges[0].metadataBadgeRenderer.label == 'LIVE NOW'){
                            let videoId = items[i].videoRenderer.videoId;
                            let title = items[i].videoRenderer.title.simpleText.replace(/[\\/:*?"<>|\r\n]/g, "");
                            resolve({"vid":videoId, "title":title});
                            break;
                        }
                    }
                    
                }
                
            }
        }).catch((err) => {
            console.error(`${channel}: ${err}`);
        });
    });
}
function hb(vid){
    let ip = ips[Math.round(Math.random() * (ips.length-1))];
    let options = {
        uri: 'https://'+ip+'/heartbeat?video_id='+vid,
        headers: {
            'Host': 'www.youtube.com',
            'accept-language': 'en-US,en;',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.109 Safari/537.36'
        }
    };
    return new Promise((resolve, reject) => {
        rp(options).then((json) => {
            resolve(json);
        }).catch((err) => {
            console.error(`${vid} heartbeat error: ${err}`);
        });
    });
}

module.exports = {
    getInfo,
    hb
}