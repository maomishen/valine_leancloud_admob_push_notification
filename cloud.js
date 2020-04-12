const AV = require('leanengine')
const fs = require('fs')
const path = require('path')

var pushUrl = "http://api.push.mob.com";

var request = require('request');
var crypto = require('crypto');

var httpCommon = {

    sign:function(data, appSecret){
        var signStr = appSecret;
        if(data != null){
            signStr = data+signStr;
        }
        return crypto.createHash('md5').update(signStr).digest('hex');
    },

    /**
     *  HTTP POST请求，返回JSON数据格式
     * @param url
     * @param appkey
     * @param appSecret
     * @param postData
     * @param callback
     * @return json数据
     */
    post: function (appkey, appSecret ,url, postData, callback) {
        var options = {
            uri: url,
            method: 'post',
            timeout: 30000,
            rejectUnauthorized: false,
            headers: {
                'Content-Type': 'text/html;charset=UTF-8',
                'User-Agent': 'MobPush client for NodeJs',
                'Accept': '*/*',
                'key':appkey,
                'sign':httpCommon.sign(JSON.stringify(postData), appSecret)
            }
        };
        options.json = true;
        options.body = postData;
        request(
            options,
            function (err, res, data) {
                if (!err && res.statusCode == 200) {
                    if (typeof data == 'string') {
                        data = JSON.parse(data);
                    }
                    callback && callback(null, data['res']);
                } else {
                    if(data != null && data != undefined){
                        if (typeof data == 'string') {
                            data = JSON.parse(data);
                        }
                        callback && callback( data['error'], null);
                    }else{
                        callback && callback(err, null);
                    }
                }
            });
    },

    /**
     *  HTTP GET请求，返回JSON数据格式
     * @param url
     * @param appkey
     * @param appSecret
     * @param callback, 回调需要两个参数 第一个接受error信息，第二个接受正确返回数据
     * @return json数据
     */
    get:function(appkey, appSecret, url, callback){
        var options = {
            uri: url,
            method: 'get',
            timeout: 30000,
            rejectUnauthorized: false,
            headers: {
                'Content-Type': 'text/html;charset=UTF-8',
                'User-Agent': 'MobPush client for NodeJs',
                'Accept': '*/*',
                'key':appkey,
                'sign':httpCommon.sign(null, appSecret)
            }
        };
        options.json = true;
        request(
            options,
            function (err, res, data) {
                if (!err && res.statusCode == 200) {
                    if (typeof data == 'string') {
                        data = JSON.parse(data);
                    }
                    callback && callback(null, data['res']);
                } else {
                    if(!data){
                        callback && callback( data['error'], null);
                    }else{
                        callback && callback(err, null);
                    }
                }
            });
    }
}

var pushClient = {

    /**
     * 推送详情（根据batchId查询）
     * */
    getPushByBatchId: function (appkey, appSecret, batchId, callback) {
        if (batchId == null || batchId == "") {
            callback("batchId is null ", null);
            return false;
        }
        var path = pushUrl + "/push/id/" + batchId;
        httpCommon.get(appkey, appSecret, path, callback);
    },

    /**
     * 推送详情（根据workno查询）
     * */
    getPushByWorkno: function (appkey, appSecret, workno, callback) {
        if (workno == null || workno == "") {
            callback("workno is null ", null);
            return false;
        }
        var path = pushUrl + "/push/workno/" + workno;
        httpCommon.get(appkey, appSecret, path, callback);
    },

    /**
     * 发送推送
     * @param pushWork
     * @return batchId (MobPush 推送消息唯一ID)
     * @throws ApiException
     */
    sendPush: function (appkey, appSecret, json, callback) {
        if(!json){
            callback("pushwork is null ", null);
            return false;
        }
        var path = pushUrl + "/v2/push";
        if (typeof json == 'string') {
            json = JSON.parse(json);
        }
        if (!json.content) {
            callback("content is null ", null);
            return false;
        } else if (!json.target) {
            callback("target is null ", null);
            return false;
        } else if (!json.type) {
            callback("type is null ", null);
            return false;
        } else if (!appkey) {
            callback("appkey is null ", null);
            return false;
        } else if (!appSecret) {
            callback("appSecret is null ", null);
            return false;
        } else if (!json.plats) {
            callback("plats is null or error", null);
            return false;
        }
        httpCommon.post(appkey, appSecret, path, json, function (err, data) {
            if (err != null) {
                callback && callback(err, data);
            } else {
                callback && callback(null, data);
            }
        });
    }
}

/**
 * 设置扩展信息
 * @param unlineTime 整数 1~ 10
 * @param extras
 * @param iosProduction  整数 0 ,1
 * @return PushWork
 */
function buildExtra(unlineTime,extras,iosProduction){
  if(unlineTime  != null && (unlineTime > 0 && unlineTime <= 10))
      this.payload.unlineTime = unlineTime;
  if(extras != null)
      this.payload.extras = extras;
  if(iosProduction != null && (iosProduction == 0 || iosProduction == 1))
      this.payload.iosProduction = iosProduction;
  return this;
}

/**
* moblink 跳转
* @param {moblink url} scheme 
* @param {moblink 参数} data 
* @return PushWork
*/
function buildScheme(scheme,data){
  if(scheme != null)
      this.payload.scheme = scheme;
  if(scheme != null)
      this.payload.data = data;
  return this;
}

/**
* 设置推送范围
* @param target
* @param tags
* @param alias
* @param registrationIds
* @param city
* @param block
* @return PushWork
*/
function buildTarget(){
  if (arguments.length > 0) {
      var target = arguments[0];
      var val = arguments[1];
      if(target == null || target == 1){
          this.payload.target = target;
          return this;
      }else if(target  == 2 && val != null && (val instanceof  Array)){
          this.payload.alias = val;
      }else if(target == 3 && val != null  && (val instanceof  Array)){
          this.payload.tags = val;
      }if(target  == 4 && val != null  && (val instanceof  Array)){
          this.payload.registrationIds = val;
      }if(target == 5 && !val){
          this.payload.city = val;
      }if(target == 6 && !val){
          this.payload.block = val;
      }
  this.payload.target = target;
  }
  return this;
}


/**
* 设置Android信息
* @param androidTitle
* @param androidstyle
* @param androidContent
* @param androidVoice
* @param androidShake
* @param androidLight
* @return PushWork
*/
function buildAndroid(androidTitle, androidstyle,androidContent,
  androidVoice, androidShake, androidLight) {
  if (androidTitle != null)
      this.payload.androidTitle = androidTitle;
  if (androidstyle != null && (androidstyle instanceof  Number))
      this.payload.androidstyle = androidstyle;
  if (androidContent != null && androidContent != null  && (androidContent instanceof  Array))
      this.payload.androidContent = androidContent;
  if (androidVoice != null)
      this.payload.androidVoice = androidVoice;
  if (androidShake != null)
      this.payload.androidShake = androidShake;
  if (androidLight != null)
      this.payload.androidLight = androidLight;
  return this;
}

/**
* 设置IOS信息
* @param iosTitle
* @param iosSubtitle
* @param iosSound
* @param iosBadge
* @param iosCategory
* @param iosSlientPush
* @param iosContentAvailable
* @param iosMutableContent
* @return PushWork
*/
function buildIos(iosTitle, iosSubtitle, iosSound, iosBadge, iosCategory,
  iosSlientPush, iosContentAvailable, iosMutableContent) {
  if (iosTitle != null && iosTitle != undefined)
      this.payload.iosTitle = iosTitle;
  if (iosSubtitle != null && iosSubtitle != undefined)
      this.payload.iosSubtitle = iosSubtitle;
  if (iosSound != null && iosSound != undefined)
      this.payload.iosSound = iosSound;
  if (iosBadge != null)
      this.payload.iosBadge = iosBadge;
  if (iosCategory != null)
      this.payload.iosCategory = iosCategory;
  if (iosSlientPush != null)
      this.payload.iosSlientPush = iosSlientPush;
  if (iosContentAvailable != null)
      this.payload.iosContentAvailable = iosContentAvailable;
  if (iosMutableContent != null)
      this.payload.iosMutableContent = iosMutableContent;
  return this;
}


PushWork.prototype.buildExtra = buildExtra;
PushWork.prototype.buildTarget = buildTarget;
PushWork.prototype.buildAndroid = buildAndroid;
PushWork.prototype.buildIos = buildIos;
PushWork.prototype.buildScheme = buildScheme;

PushWork.prototype.ALL = [1,2]; //所有平台
PushWork.prototype.notify=1; //通知消息
PushWork.prototype.custom=1; //透传消息

//module.exports = pushWork;
function  PushWork(plats, content, type) {
  this.payload = {};
  if(plats != null && (plats instanceof  Array)){
      this.payload.plats = plats;
  }
  if(content != null && content != undefined){
      this.payload.content = content;
  }
  if(type != null  && (type == 1 || type == 2) ){
      this.payload.type = type;
  }
}

/**
 * 加载 functions 目录下所有的云函数
 */
fs.readdirSync(path.join(__dirname, 'functions')).forEach( file => {
  require(path.join(__dirname, 'functions', file))
})

AV.Cloud.afterSave('Comment', async function(request) {

  var appkey = process.env.ADMOB_PUSH_KEY;
  var appSecret = process.env.ADMOB_PUSH_SECRET;

  var push = new PushWork.PushWork(PushWork.ALL,"test content" , PushWork.notify) //初始化基础信息
    .buildTarget(1, null, null, null, null, null)  // 设置推送范围
    .buildAndroid("Android Title", 0, null, true, true, true) //定制android样式
    .buildIos("ios Title", "ios Subtitle", null, 1, null, null, null, null) //定制ios设置
    .buildExtra(1, "{\"key1\":\"value\"}") // 设置扩展信息
  ;
  pushClient.sendPush(appkey, appSecret ,push.payload,function(err, data){
      console.log(err);
      console.log(data);
  });
})
