//index.js
//获取应用实例
const app = getApp();
const recorder = wx.getRecorderManager();
const player = wx.createInnerAudioContext();
const file = wx.getFileSystemManager();
var that;

Page({
  data: {
    motto: 'Hello World',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    /**
     * 页面的初始数据
     */
    apikey: 'kS4ZvgDTUFmDPL0RbZHk27yZlkUzFH5h',
    secret_id: 'AKIDV3PVMxbSL0UjhW5dojQxEMGuJSM0djjU',
    token: "",
    recording: false,
    cancel_record: false,
    start_y: '',

    fileBase64: '', //base64的文件
    rate: 8000,
    filePath: '',//录音文件
    fileLen: 0,//录音长度
    translatedData: '',
    addButtonAnimation: '',
    inputFocus: false,
    enableSpeak: false,
    inputAreaShow: false,
    hold: false,
    holdStartTime: '',
    taskList: ['今天的第一个任务（占位）'],
    audioRecording: false,
    miniKeyboardHeight: '',
    inputNotEmpty: false,
    tagInputActive: false,
    subInfoShow: false,
    taskContent: '',
    inputToolBarShow: false,
    preSetTagList: ["旅行", "读书", "计划", "学习", "项目"],
    tagValue: ''
  },
  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onLoad: function () {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse){
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }

    //先定好停止录音后要干嘛
    that = this;
    recorder.onStop(function suc(e) {
      //保存录音文件的临时路径
      that.setData({
        filePath: e.tempFilePath,
      })
      wx.setStorageSync('filePath', e.tempFilePath);
      //友好的菊花加载
      wx.showLoading({
        title: '文件读取中...'
      })
      //读取录音文件，并转为base64编码
      file.readFile({
        filePath: e.tempFilePath,
        encoding: 'base64',
        success: function (e) {
          that.setData({
            fileBase64: e.data
          })
          console.log(e, 'readfile ok');
          that.submit();
        },
        complete() {
          wx.hideLoading();
        },
      })
    })
  },

  //手指按下
  clickDown(e) {
    console.log('start');
    that.setData({
      recording: true,
      start_y: e.touches[0].clientY,
      cancel_record: false,
    })

    //开始录音
    recorder.start({
      duration: 60000,//最大时长
      sampleRate: that.data.rate,//采样率
      numberOfChannels: 1,//录音通道数
      encodeBitRate: 24000,//编码码率，有效值见下表格
      format: 'mp3',//音频格式
      // frameSize: 2000,//指定大小 kb
    })
  },
  clickDown1(e) {
    this.setData({
      hold: true,
      holdStartTime: e.timeStamp,
    })

    setTimeout(() => {
      if (this.data.hold) {
        that.setData({
          recording: true,
          start_y: e.touches[0].clientY,
          cancel_record: false,
          audioRecording: true
        })
        //开始录音
        recorder.start({
          duration: 60000,//最大时长
          sampleRate: that.data.rate,//采样率
          numberOfChannels: 1,//录音通道数
          encodeBitRate: 24000,//编码码率，有效值见下表格
          format: 'mp3',//音频格式
          // frameSize: 2000,//指定大小 kb
        })
        
      }
    }, 400);
    
  },
  clickUp1(e) {
    this.setData({
      hold: false,
      audioRecording: false
    })
    if (e.timeStamp - this.data.holdStartTime < 350) {
      this.add()     
    } else {
      recorder.stop();
    }
  },

  //手指松开
  clickUp(e) {
    console.log('end');
    if (that.data.cancel_record) {
      wx.showModal({
        title: '提示',
        content: '您选择了取消发送,确定吗?',
        confirmText: '继续发送',
        cancelText: '取消重录',
        success: res => {
          if (res.confirm) {
            wx.showToast({
              title: '发送成功',
            })
          } else {
            wx.showToast({
              title: '您选择了取消',
            })
          }
          that.setData({
            recording: false
          })
        }
      })
    } else {
      wx.showToast({
        title: '发送成功',
      })
      that.setData({
        recording: false
      })
    }
    recorder.stop();
    return false;
  },

  //播放
  play() {
    player.src = that.data.filePath;
    player.play();
  },

  //语音识别
  submit() {
    let apikey = that.data.apikey;
    let param = {
      Action: 'SentenceRecognition',
      Version: '2019-06-14',
      ProjectId: '0',//腾讯云项目ID
      SubServiceType: 2, //一句话识别，没得选
      EngSerViceType: '8k',//引擎类型 8k（电话） 或 16k，没说明白
      SourceType: 1,//0 url  1数据
      VoiceFormat: 'mp3',//格式 MP3 或 wav
      UsrAudioKey: new Date().getTime(),//唯一识别？直接用时间戳吧珂珂
      Data: that.data.fileBase64,
      DataLen: base64_decode(that.data.fileBase64).length,//未进行base64编码时的数据长度
      // Url :'',你懂的
      Timestamp: parseInt(new Date().getTime() / 1000),
      Nonce: parseInt(new Date().getTime() / 1000),
      SecretId: that.data.secret_id,
    };

    //把参数按键值大小排序并拼接成字符串
    let data = ksort(param);
    let arr = [];
    for (var x in data) {
      data[x] = encodeURI(data[x]);
      arr.push(x + '=' + data[x]);
    }
    let str = arr.join('&');
    //签名生成
    let sign = 'POSTasr.tencentcloudapi.com/?' + str;
    sign = b64_hmac_sha1(apikey, sign);
    data['Signature'] = sign;
    //友好的菊花提示
    wx.showLoading({
      title: '发送中...',
    })
    console.log(data, 'this is data')
    wx.request({
      url: 'https://asr.tencentcloudapi.com/',
      data: data,
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      method: 'post',
      success: function (e) { 
        console.log(e.data.Response) 
        that.setData({
          translatedData: e.data.Response.Result
        })
        var taskList = that.data.taskList
        taskList.push(e.data.Response.Result)
        that.setData({
          taskList: taskList


        })

        console.log(that.data.taskList)
      },
      complete() { wx.hideLoading(); }
    })
  },


  add() {
    this.setData({
      addButtonAnimation: true,
      inputAreaShow: true,
      inputToolBarShow: true
    })
    setTimeout(() => {
      this.setData({
        inputFocus: true
      })
    },100)
  },

  end() {
    this.setData({
      addButtonAnimation: false,
      
    })
  },

  disableInput() {
    this.setData({
      inputFocus: false,
      inputShow: false,
      inputAreaShow:false,
      miniKeyboardHeight: -30,
      taskContent: '',
      subInfoShow: false,
      inputNotEmpty: false,
      inputToolBarShow: false
    })
  },

  toggleSpeak() {
    this.setData({
      enableSpeak: true
    })
  },

  onbindfocus(e) {
    this.setData({
      miniKeyboardHeight: e.detail.height
    })
  },
  onbindinput(e) {
    if (e.detail.value.trim()) {
      this.setData({
        inputNotEmpty: true
      })
    } else {
      this.setData({
        inputNotEmpty: false
      })
    }
  },
  showSubInfo() {
    this.setData({
      subInfoShow: true,
      tagInputActive: true
    })
  },
  hideToolBar() {
    this.setData({
      inputToolBarShow: false,
      miniKeyboardHeight: -30
    })
  },
  selectTag(e) {
    this.setData({
      tagValue: e.currentTarget.dataset.item,
      tagInputActive: false
    })

  }

})

//对象按键值排序方法
function ksort(obj) {
  let temp = 'Action';
  let k_arr = [];
  for (var x in obj) {
    k_arr.push(x);
  }
  k_arr.sort();
  let res = {};
  for (let i = 0; i < k_arr.length; i++) {
    let k = k_arr[i];
    res[k] = obj[k];
  }
  return res;
}

//这个是找了很久的加密函数
function b64_hmac_sha1(k, d, _p, _z) {
  // heavily optimized and compressed version of http://pajhome.org.uk/crypt/md5/sha1.js
  // _p = b64pad, _z = character size; not used here but I left them available just in case
  if (!_p) { _p = '='; } if (!_z) { _z = 8; } function _f(t, b, c, d) { if (t < 20) { return (b & c) | ((~b) & d); } if (t < 40) { return b ^ c ^ d; } if (t < 60) { return (b & c) | (b & d) | (c & d); } return b ^ c ^ d; } function _k(t) { return (t < 20) ? 1518500249 : (t < 40) ? 1859775393 : (t < 60) ? -1894007588 : -899497514; } function _s(x, y) { var l = (x & 0xFFFF) + (y & 0xFFFF), m = (x >> 16) + (y >> 16) + (l >> 16); return (m << 16) | (l & 0xFFFF); } function _r(n, c) { return (n << c) | (n >>> (32 - c)); } function _c(x, l) { x[l >> 5] |= 0x80 << (24 - l % 32); x[((l + 64 >> 9) << 4) + 15] = l; var w = [80], a = 1732584193, b = -271733879, c = -1732584194, d = 271733878, e = -1009589776; for (var i = 0; i < x.length; i += 16) { var o = a, p = b, q = c, r = d, s = e; for (var j = 0; j < 80; j++) { if (j < 16) { w[j] = x[i + j]; } else { w[j] = _r(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1); } var t = _s(_s(_r(a, 5), _f(j, b, c, d)), _s(_s(e, w[j]), _k(j))); e = d; d = c; c = _r(b, 30); b = a; a = t; } a = _s(a, o); b = _s(b, p); c = _s(c, q); d = _s(d, r); e = _s(e, s); } return [a, b, c, d, e]; } function _b(s) { var b = [], m = (1 << _z) - 1; for (var i = 0; i < s.length * _z; i += _z) { b[i >> 5] |= (s.charCodeAt(i / 8) & m) << (32 - _z - i % 32); } return b; } function _h(k, d) { var b = _b(k); if (b.length > 16) { b = _c(b, k.length * _z); } var p = [16], o = [16]; for (var i = 0; i < 16; i++) { p[i] = b[i] ^ 0x36363636; o[i] = b[i] ^ 0x5C5C5C5C; } var h = _c(p.concat(_b(d)), 512 + d.length * _z); return _c(o.concat(h), 512 + 160); } function _n(b) { var t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", s = ''; for (var i = 0; i < b.length * 4; i += 3) { var r = (((b[i >> 2] >> 8 * (3 - i % 4)) & 0xFF) << 16) | (((b[i + 1 >> 2] >> 8 * (3 - (i + 1) % 4)) & 0xFF) << 8) | ((b[i + 2 >> 2] >> 8 * (3 - (i + 2) % 4)) & 0xFF); for (var j = 0; j < 4; j++) { if (i * 8 + j * 6 > b.length * 32) { s += _p; } else { s += t.charAt((r >> 6 * (3 - j)) & 0x3F); } } } return s; } function _x(k, d) { return _n(_h(k, d)); } return _x(k, d);
}


function base64_decode(input) { // 解码，配合decodeURIComponent使用
  var base64EncodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  var output = "";
  var chr1, chr2, chr3;
  var enc1, enc2, enc3, enc4;
  var i = 0;
  input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
  while (i < input.length) {
    enc1 = base64EncodeChars.indexOf(input.charAt(i++));
    enc2 = base64EncodeChars.indexOf(input.charAt(i++));
    enc3 = base64EncodeChars.indexOf(input.charAt(i++));
    enc4 = base64EncodeChars.indexOf(input.charAt(i++));
    chr1 = (enc1 << 2) | (enc2 >> 4);
    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    chr3 = ((enc3 & 3) << 6) | enc4;
    output = output + String.fromCharCode(chr1);
    if (enc3 != 64) {
      output = output + String.fromCharCode(chr2);
    }
    if (enc4 != 64) {
      output = output + String.fromCharCode(chr3);
    }
  }
  return utf8_decode(output);
}


function utf8_decode(utftext) { // utf-8解码
  var string = '';
  let i = 0;
  let c = 0;
  let c1 = 0;
  let c2 = 0;
  while (i < utftext.length) {
    c = utftext.charCodeAt(i);
    if (c < 128) {
      string += String.fromCharCode(c);
      i++;
    } else if ((c > 191) && (c < 224)) {
      c1 = utftext.charCodeAt(i + 1);
      string += String.fromCharCode(((c & 31) << 6) | (c1 & 63));
      i += 2;
    } else {
      c1 = utftext.charCodeAt(i + 1);
      c2 = utftext.charCodeAt(i + 2);
      string += String.fromCharCode(((c & 15) << 12) | ((c1 & 63) << 6) | (c2 & 63));
      i += 3;
    }
  }
  return string;
}