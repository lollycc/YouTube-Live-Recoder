const rp = require('request-promise');
const fs = require('fs');
let ips = fs.readFileSync('./data/ips.txt', 'utf8').split(/[(\r\n)\r\n]+/);
let getInfo = (channel) => {
    let ip = ips[Math.round(Math.random() * (ips.length-1))];
    let options = {
        uri: 'https://'+ip+'/channel/'+channel+'/live',
        headers: {
            'Host': 'www.youtube.com',
            'accept-language': 'en-US,en;',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.109 Safari/537.36'
        }
    };
    return new Promise((resolve, reject) => {
        rp(options).then((htmlString) => {
            let regExp = /{};ytplayer\.config =(.*);ytplayer\.load/;
            let res = regExp.exec(htmlString);
            let data = JSON.parse(res[1]);
            let title = data.args.title.replace(/[\\/:*?"・<>|\r\n]/g, "");;
            let vid = data.args.video_id;
            if(null != title && null != vid){
                resolve({"vid":vid, "title":title});
            }
        }).catch((err) => {

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
            resolve(JSON.parse(json));
        }).catch((err) => {
            console.error(`${vid} heartbeat error: ${err}`);
        });
    });
}


module.exports = {
    getInfo,
    hb
}