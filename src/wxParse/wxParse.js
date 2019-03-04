/**
 * author: Di (微信小程序开发工程师)
 * organization: WeAppDev(微信小程序开发论坛)(http://weappdev.com)
 *               垂直微信小程序开发交流社区
 * 
 * github地址: https://github.com/icindy/wxParse
 * 
 * for: 微信小程序富文本解析
 * detail : http://weappdev.com/t/wxparse-alpha0-1-html-markdown/184
 */

/**
 * utils函数引入
 **/
import showdown from './showdown.js';
import HtmlToJson from './html2json.js';
/**
 * 配置及公有属性
 **/
var realWindowWidth = 0;
var realWindowHeight = 0;
wx.getSystemInfo({
  success: function (res) {
    realWindowWidth = res.windowWidth
    realWindowHeight = res.windowHeight
  }
})
/**
 * 主函数入口区
 **/
function wxParse(bindName = 'wxParseData', type='html', data='<div class="color:red;">数据不能为空</div>', target,imagePadding) {
  var that = target;
  var transData = {};//存放转化后的数据
  if (type == 'html') {
    transData = HtmlToJson.html2json(data, bindName);
    console.log(JSON.stringify(transData, ' ', ' '));
  } else if (type == 'md' || type == 'markdown') {
    var converter = new showdown.Converter();
    var html = converter.makeHtml(data);
    transData = HtmlToJson.html2json(html, bindName);
    console.log(JSON.stringify(transData, ' ', ' '));
  }
  transData.view = {};
  transData.view.imagePadding = 0;
  if(typeof(imagePadding) != 'undefined'){
    transData.view.imagePadding = imagePadding
  }
  var bindData = {};
  bindData[bindName] = transData;
  that.setData(bindData)
  that.wxParseImgLoad = wxParseImgLoad;
  that.wxParseImgTap = wxParseImgTap;
}
// 图片点击事件
function wxParseImgTap(e) {
  var that = this;
  var nowImgUrl = e.target.dataset.src;
  var tagFrom = e.target.dataset.from;
  if (typeof (tagFrom) != 'undefined' && tagFrom.length > 0) {
    wx.previewImage({
      current: nowImgUrl, // 当前显示图片的http链接
      urls: that.data[tagFrom].imageUrls // 需要预览的图片http链接列表
    })
  }
}

/**
 * 图片视觉宽高计算函数区 
 **/
function wxParseImgLoad(e) {
  var that = this;
  var tagFrom = e.target.dataset.from;
  var idx = e.target.dataset.idx;
  if (typeof (tagFrom) != 'undefined' && tagFrom.length > 0) {
    calMoreImageInfo(e, idx, that, tagFrom)
  } 
}
// 假循环获取计算图片视觉最佳宽高
function calMoreImageInfo(e, idx, that, bindName) {
  var temData = that.data[bindName];
  if (!temData || temData.images.length == 0) {
    return;
  }
  var temImages = temData.images;
  //因为无法获取view宽度 需要自定义padding进行计算，稍后处理
  var recal = wxAutoImageCal(e.detail.width, e.detail.height, that, bindName, temImages[idx]); 
  // temImages[idx].width = recal.imageWidth;
  // temImages[idx].height = recal.imageheight; 
  // temData.images = temImages;
  // var bindData = {};
  // bindData[bindName] = temData;
  // that.setData(bindData);
  var index = temImages[idx].index
  var key = `${bindName}`
  for (var i of index.split('.')) key+=`.nodes[${i}]`
  var keyW = key + '.width'
  var keyH = key + '.height'
  that.setData({
    [keyW]: recal.imageWidth,
    [keyH]: recal.imageheight,
  })
}

//计算视觉优先的图片宽高
function wxAutoImageCal(originalWidth, originalHeight, that, bindName, temImage) {

  var arr = temImage.attr.style;
  var widthIndex = arr.indexOf("width:");

  console.log(widthIndex);

  var widthValue = '';
  if (widthIndex != -1) {
    // widthValue = arr[widthIndex + 1];

    console.log(arr);
    var trr = arr.split(";");///sophie
    for (let i = 0; i < trr.length; ++i) {
      if (trr[i].indexOf("width") != -1) {
        widthValue = trr[i].split(":")[1];
      }
    }
    // console.log(trr);
    console.log(widthValue);
  }
  var percentageIndex = widthValue.search("%");
  var pixelIndex = widthValue.search("px");
  var percentageWidthValue = '';
  var pixelWidthValue = '';
  var pixelHeightValue = '';
  console.log(percentageIndex);
  console.log(pixelIndex);
  /**
   * 获取width的百分比数值
   * 因为widthValue是带有%和;的，例如宽度为50%，那么widthValue的数据格式为widthValue == "50%;"，
   * 因此多出来后面两个字符'%;'，所以要去除后面两位
   */
  if ((percentageIndex > 0) && (widthValue.length == percentageIndex + 2)) {
    percentageWidthValue = widthValue.slice(0, -2);
  }

  /**
   * 获取width的px数值
   * 因为widthValue是带有px和;的，例如宽度为50px，那么widthValue的数据格式为widthValue == "50px;"，
   * 因此多出来后面三个字符'px;'，所以要去除后面三位，
   * 而当width为px显示时，height和width是成对出现的
   */
  if ((pixelIndex > 0) && (widthValue.length == pixelIndex + 2)) {
    pixelWidthValue = widthValue.slice(0, -2);

    var heightIndex = arr.indexOf("height:");
    var heightValue = '';
    if (heightIndex != -1) {
      // heightValue = arr[heightIndex + 1];
      console.log(arr);
      var hrr = arr.split(";");///sophie
      for (let i = 0; i < hrr.length; ++i) {
        if (hrr[i].indexOf("height") != -1) {
          heightValue = hrr[i].split(":")[1];
        }
      }
      console.log(heightValue);
    }
    var pixelHeightIndex = heightValue.search("px");
    if ((pixelHeightIndex > 0) && (heightValue.length == pixelHeightIndex + 2)) {
      pixelHeightValue = heightValue.slice(0, -2);
    }
  }
  console.log(pixelHeightValue);
  //获取图片的原始长宽
  var windowWidth = 0, windowHeight = 0;
  var autoWidth = 0, autoHeight = 0;
  var results = {};
  var padding = that.data[bindName].view.imagePadding;
  windowWidth = realWindowWidth - 2 * padding;
  windowHeight = realWindowHeight;

  /**
   * 1、如果图片的宽度style是百分比的参数形式，那么图片在微信中展示的宽度就定义为 手机屏幕宽度*宽度百分比；
   * 2、如果图片的宽度style是px的参数形式，并且该宽度小于屏幕宽度，那么图片在微信中展示的宽、高就定义为 style所设置的宽、高；
   * 3、此外，则按原插件逻辑进行图片大小定义，在图片width大于手机屏幕width时等比例缩放至屏幕大小，
   *   未大于手机屏幕width时则按图片原尺寸显示
   */
  if (percentageWidthValue) {
    autoWidth = (windowWidth * percentageWidthValue) / 100;
    autoHeight = (autoWidth * originalHeight) / originalWidth;
    results.imageWidth = autoWidth;
    results.imageheight = autoHeight;

  } else if (pixelWidthValue && pixelHeightValue && (pixelWidthValue <= windowWidth)) {
    results.imageWidth = pixelWidthValue;
    results.imageheight = pixelHeightValue;



  } else {
    //判断按照那种方式进行缩放
    // console.log("windowWidth" + windowWidth);
    if (originalWidth > windowWidth) {//在图片width大于手机屏幕width时候
      autoWidth = windowWidth;
      // console.log("autoWidth" + autoWidth);
      autoHeight = (autoWidth * originalHeight) / originalWidth;
      // console.log("autoHeight" + autoHeight);
      results.imageWidth = autoWidth;
      results.imageheight = autoHeight;

    } else {//否则展示原来的数据
      results.imageWidth = originalWidth;
      results.imageheight = originalHeight;

    }
  }
  return results;

}


function wxParseTemArray(temArrayName,bindNameReg,total,that){
  var array = [];
  var temData = that.data;
  var obj = null;
  for(var i = 0; i < total; i++){
    var simArr = temData[bindNameReg+i].nodes;
    array.push(simArr);
  }

  temArrayName = temArrayName || 'wxParseTemArray';
  obj = JSON.parse('{"'+ temArrayName +'":""}');
  obj[temArrayName] = array;
  that.setData(obj);
}

/**
 * 配置emojis
 * 
 */

function emojisInit(reg='',baseSrc="/wxParse/emojis/",emojis){
   HtmlToJson.emojisInit(reg,baseSrc,emojis);
}

module.exports = {
  wxParse: wxParse,
  wxParseTemArray:wxParseTemArray,
  emojisInit:emojisInit
}


