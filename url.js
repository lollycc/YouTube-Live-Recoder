const rp = require('request-promise');

let getVid = (channel) => {
    let options = {
        uri: 'https://www.youtube.com/channel/'+channel,
        headers: {
            'accept-language': 'en-US,en;',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.109 Safari/537.36'
        }
    };
    return new Promise((resolve, reject) => {
        rp(options).then((htmlString) => {
            if(htmlString.indexOf("LIVE NOW") > 0){
                let regExp = /videoId":"(.*?)".*?LIVE NOW/;
                let res = regExp.exec(htmlString);
                resolve(res[1]);
            }
        }).catch((err) => {
            console.error(`${channel}: ${err}`);
        });
    });
}
let getInfo = (vid) => {
    let options = {
        uri: 'https://www.youtube.com/watch?v='+vid,
        headers: {
            'accept-language': 'en-US,en;',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.109 Safari/537.36'
        }
    };
    return new Promise((resolve, reject) => {
        rp(options).then((htmlString) => {
            if(htmlString.indexOf("hlsManifestUrl") > 0){
                let regExp = /"title":"(.*?)"}?,/;
                let res = regExp.exec(htmlString);
                let title = res[1].replace(/[\\/:*?"<>|\r\n]/g, "");
                resolve(title);
            } else {
                reject('error to get info. vid:'+vid);
            }
        }).catch((err) => {
            console.error(`${vid}: ${err}`);
        });
    });
}

function hb(vid){
    var options = {
        uri: 'https://www.youtube.com/heartbeat?video_id='+vid,
        headers: {
            'accept-language': 'en-US,en;',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.109 Safari/537.36'
        },
        json: true
    };
    return new Promise((resolve, reject) => {
        rp(options).then((json) => {
            resolve(json);
        }).catch((err) => {
            console.error(`${vid}: ${err}`);
        });
    });
}

module.exports = {
    getVid,
    getInfo,
    hb
}