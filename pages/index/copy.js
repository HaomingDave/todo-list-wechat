const app = getApp();
const recorder = wx.getRecorderManager();
const player = wx.createInnerAudioContext();
const file = wx.getFileSystemManager();
var that;
Page({
  /**
   * 页面的初始数据
   */
  data: {
    apikey: '马赛克',
    secret_id: '马赛克',
    token: "",
    recording: false,
    cancel_record: false,
    start_y: '',

    fileBase64: '', //base64的文件
    rate: 8000,
    filePath: '',//录音文件
    fileLen: 0,//录音长度
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    that = this;
    //先定好停止录音后要干嘛
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
        },
        complete() {
          wx.hideLoading();
        },
      })
    })
  },
  //语音识别
  submit() {
    let apikey = that.data.apikey;
    let param = {
      Action: 'SentenceRecognition',
      Version: '2018-05-22',
      ProjectId: '0',//腾讯云项目ID
      SubServiceType: 2, //一句话识别，没得选
      EngSerViceType: '8k',//引擎类型 8k（电话） 或 16k，没说明白
      SourceType: 1,//0 url  1数据
      VoiceFormat: 'mp3',//格式 MP3 或 wav
      UsrAudioKey: new Date().getTime(),//唯一识别？直接用时间戳吧珂珂
      Data: that.data.fileBase64,
      DataLen: app.base64_decode(that.data.fileBase64).length,//未进行base64编码时的数据长度
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
    let sign = 'POSTaai.tencentcloudapi.com/?' + str;
    sign = b64_hmac_sha1(apikey, sign);
    data['Signature'] = sign;
    //友好的菊花提示
    wx.showLoading({
      title: '发送中...',
    })
    wx.request({
      url: 'https://aai.tencentcloudapi.com/',
      data: data,
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      method: 'post',
      success: function (e) { console.log(e.data.Response) },
      complete() { wx.hideLoading(); }
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
  //手指移动
  clickMove(e) {
    if (e.touches[0].clientY - that.data.start_y <= -50) {
      that.setData({
        cancel_record: true,
      })
    } else {
      that.setData({
        cancel_record: false,
      })
    }
    return false;
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