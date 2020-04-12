const AV = require('leanengine')
const fs = require('fs')
const path = require('path')

var areaClient = require("./api/AreaClient");
var deviceClient = require("./api/deviceClient");
var pushClient = require("./api/pushClient");
var PushWork = require("./api/PushWork");
var statsClient = require("./api/statsClient");

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
