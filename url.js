var rp = require('request-promise');
function getVid(channel){
    var options = {
        uri: 'https://www.youtube.com/channel/'+channel,
        headers: {
            'accept-language': 'en-US,en;',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.109 Safari/537.36'
        }
    };
    return new Promise(function(resolve, reject){
        rp(options).then(function (htmlString) {
            if(htmlString.indexOf("LIVE NOW") > 0){
                var regExp = /videoId":"(.*?)".*?LIVE NOW/;
                var res = regExp.exec(htmlString);
                resolve(res[1]);
            } else {
                reject('no live.');
            }
        });
    });
}
function status(vid){
    var options = {
        uri: 'https://www.youtube.com/heartbeat?video_id='+vid,
        headers: {
            'accept-language': 'en-US,en;',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.109 Safari/537.36'
        },
        json: true
    };
    return new Promise(function(resolve, reject){
        rp(options).then(function (json) {
            resolve(json.status);
        });
    });
}
function getM3u8(vid){
    var options = {
        uri: 'https://www.youtube.com/watch?v='+vid,
        headers: {
            'accept-language': 'en-US,en;',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.109 Safari/537.36'
        }
    };
    return new Promise(function(resolve, reject){
        rp(options).then(function (htmlString) {
            if(htmlString.indexOf("hlsManifestUrl") > 0){
                var regExp = /"title":"(.*?)",/;
                var res = regExp.exec(htmlString);
                var title = res[1].replace(/[~!@#$%^&*，。；‘’\\{\[\]}|\/]/g, "");
                regExp = /hlsManifestUrl\\":\\"(.*?m3u8)/;
                res = regExp.exec(htmlString);
                var m3u8List = res[1].replace(/\\/g,"");
                rp(m3u8List).then(function(body){
                    var reg = /(http.*?m3u8)/g;
                    var m3u8 = "";   
                    while(res = reg.exec(body)){   
                        m3u8 = res;
                    }
                    if(m3u8[1]){
                        resolve([title, m3u8[1]]);
                    } else {
                        reject('error to get m3u8. vid:'+vid);
                    }
                    
                });
            } else {
                reject('error to get m3u8. vid:'+vid);
            }
        });
    });
}

module.exports = {
    getVid,
    getM3u8,
    status
}