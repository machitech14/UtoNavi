/**
 * ゴミチェッカー専用のライブラリ
 *
 * $.getinfo(args, success, error)
 * ===============================
 * XMLデータとテンプレートデータを取得し完了時にコールバック関数を呼び出す
 *
 * @param args
 *   連想配列形式の引数
 *       xml: XMLファイル
 *       template: テンプレートファイル
 *       tag: 処理対象要素のタグ (省略時はルート)
 * @param success
 *   正常終了時のコールバック関数
 *       第１引数: XMLデータ
 *       第２引数: テンプレートデータ (連想配列)
 *   【備考】$.convert()を利用してXMLデータとテンプレートデータの置換処理結果
 *     のみを使う場合は引数を使う必要はない．
 * @param error
 *   エラー発生時のコールバック関数
 *       第１引数: エラーメッセージ
 *
 * 【使用例】
 *   $.getinfo({xml: "xml/gomi.xml", template: "text/gomi.txt", tag: null},
 *     function (obj, map) { ... },
 *     function (msg) { alert(msg); }
 *   );
 *
 * テンプレートデータの形式は次のとおり．
 *   ◆１カラム目が # の行はコメントとなる．
 *     【注意】HTMLのコメント <!-- ... --> と誤解しないこと．
 *   ◆データ定義の形式は
 *       キー:
 *         文字列データ
 *   ◆１カラム目から始まりコロンで終る行は後続する文字列データのキーと解釈
 *     される．
 *   ◆文字列データは１カラム目が半角スペースかタブで始まらなければならない．
 *   ◆文字列データ内の %d はループカウンターに置き換えられる．
 *   ◆文字列データ内の ${xyz} は XML の対応する文字列に置き換えられる．
 *
 * 【記述例】
 *   # gomichecker -- myList
 *   myList:
 *     <li data-filtertext=${dataroot.gomi[%d].keyword}>
 *       <a href='#no%d'>${dataroot.gomi[%d].name}</a>
 *     </li>
 *
 *   # gomichecker -- myContents
 *   myContents:
 *     <div data-role='page' id='no%d' data-url='no%d' data-add-back-btn='true'>
 *       <div data-role='header' align='center'>
 *         <image src='image/gomichecker.png' width='250' alt='gomichecker'>
 *       </div>
 *       <div data-role='content'>
 *         <h3>${dataroot.gomi[%d].name}</h3>
 *         <h2>${dataroot.gomi[%d].kubun}</h2>
 *         <p>${dataroot.gomi[%d].zyouken}</p>
 *       </div>
 *       <div data-role='footer' data-position='fixed' align='center'>
 *         <font size='2'>&copy;越前市ぷらぷらぼ</font>
 *       </div>
 *     </div>
 *
 * $.size(tag)
 * ===========
 * タグ名で指定された要素の兄弟要素数
 *
 * $.convert(key, index)
 * =====================
 * テンプレートのプレースホルダをXMLデータに置換した文字列を返す
 *
 * @param key
 *   テンプレートの連想配列のキー
 * @param index
 *   繰返し処理のループカウンタ
 * @return
 *   置換された文字列
 *
 * $.templateString(map)
 * =====================
 * 連想配列形式のテンプレートデータを文字列に変換 (デバッグ出力用)
 *
 * $.xmlString(xml)
 * ================
 * XMLデータを文字列に変換 (デバッグ出力用)
 */
;(function ($, window, document, undefined) {
  // 現時点で window, document は未使用

  var jqueryObject;        // jQueryオブジェクト形式のXMLデータ
  var templateMap;         // 連想配列形式のテンプレートデータ
  var onSuccess, onError;  // 処理完了時のコールバック関数
  var xmlError, textError; // エラーメッセージ

  $.size = count;

  /**
   * タグ名で指定された要素の兄弟要素数を返す．
   */
  function count(tag) {
    return $(tag, jqueryObject).length;
  }

  /**
   * XMLデータとテンプレートデータを取得し完了時にコールバック関数を呼び出す
   * 【使用例】
   *   var args = { xml: "xml/gomi.xml", template: "text/gomi.txt", tag: null };
   *   $("#area").getinfo(args,
   *     function (obj, map) { ... },
   *     function (msg) { alert(msg); }
   *   );
   */
  $.fn.getinfo = getData;

  /**
   * XMLデータとテンプレートデータを取得し完了時にコールバック関数を呼び出す
   * 【使用例】
   *   $.getinfo({ xml: "xml/gomi.xml", template: "text/gomi.txt", tag: null },
   *     function (obj, map) { ... },
   *     function (msg) { alert(msg); }
   *   );
   */
  $.getinfo = getData;

  /**
   * XMLデータとテンプレートデータの取得
   */
  function getData(args, success, error) {
    var params = args || {
        xml: "xml/gomi.xml", template: "text/gomi.txt", tag: null
    };
    onSuccess = success;
    onError = error;
    getXml(params.xml, params.tag);
    getTemplate(params.template);
    return this;
  };

  /**
   * XMLデータの取得
   *
   * エラー発生時は変数 xmlError にエラーメッセージが記憶される．
   * 正常終了時は変数 jqueryObject にXMLデータ(jQuery Object)が記憶される．
   * 引数 tagname 未定義またはnullとするとすべてのデータが得られ tagname を
   * 指定すると部分データが得られる．
   */
  function getXml(xmlurl, tagname) {
    $.ajax({
      url: xmlurl,
      type: "GET",
      dataType: "xml",
      error:
        function () {
          xmlError = "Error: cannot get XML data";
          check();
        },
      success:
        function (xml) {
          // 引数 xml は Document であり Element ではない．
          // xml.firstChild は Element である．
          jqueryObject = tagname ? $(tagname, xml) : $(xml.firstChild);
          xmlError = "OK";
          check();
        }
    });
  }

  /**
   * テンプレートデータの取得
   *
   * エラー発生時は変数 textError にエラーメッセージが記憶される．
   * 正常終了時は変数 templateMap にテンプレートデータが連想配列形式で記憶
   * される．
   */
  function getTemplate(texturl) {
    $.ajax({
      url: texturl,
      type: "GET",
      dataType: "text",
      error:
        function () {
          textError = "Error: cannot get text data";
          check();
        },
      success:
        function (text) {
          //console.log("text=" + text);
          var map = createMap(text);
          if (map === null) {
            textError = "Error: text data is empty";
          } else {
            templateMap = map;
            textError = "OK";
          }
          check();
        }
    });
  }

  /**
   * テンプレートデータを連想配列形式に変換
   */
  function createMap(text) {
    var map = {};
    if (text.length < 2)
      return null;
    var eol = text.charAt(text.length-2) === "\r" ? "\r\n" : "\n";
    var lines = text.split(eol);
    var line, c;
    var key = "", value = "";
    for (var n = 0; n < lines.length; n++) {
      line = lines[n];
      if (line.length <= 0)
        continue;
      if ((c = line.charAt(0)) === "#")
        continue;
      if (c === " " || c === "\t") {
        value += line + eol;
      } else {
        if (key.length > 0 && value.length > 0)
          map[key] = value;
        value = "";
        key = line;
        if (key.charAt(key.length-1) === ":")
          key = key.substring(0, key.length-1);
      }
    }
    if (key.length > 0 && value.length > 0)
      map[key] = value;
    return map;
  }

  /**
   * XMLデータとテンプレートデータの取得が両方完了したら成功または失敗の
   * コールバックを実行する．
   */
  function check() {
    if (!xmlError || !textError)
      return;
    if (jqueryObject && templateMap) {
      onSuccess(jqueryObject, templateMap);
    } else {
      var xpos = xmlError.indexOf("Error:");
      var tpos = textError.indexOf("Error:");
      var s;
      if (xpos >= 0 && tpos >= 0)
        s = "Error: cannot get XML data and text data";
      else if (xpos >= 0)
        s = xmlError;
      else
        s = textError;
      onError(s);
    }
  }

  //-------------------------------------------------------------------------

  $.convert = replace;

  /**
   * テンプレートのプレースホルダをXMLデータに置換した文字列を返す．
   * @param key テンプレートの連想配列のキー
   * @param index 繰返し処理のループカウンタ
   */
  function replace(key, index, map, xml) {
    map = map || templateMap;
    xml = xml || jqueryObject;
    if (!map || !xml)
      return null;
    var template = map[key];
    if (template.indexOf('<!--') >= 0)
      template = template.replace(/<!--[\s\S]*?-->/gm, '');
    if (template.indexOf('%d') >= 0)
      template = template.replace(/%d/g, index);
    //console.log(template);
    var array = [];
    var offset = 0, length = template.length, start, end, xmlkey;
    for ( ; offset < length; offset = end + 1) {
      if ((start = template.indexOf('${', offset)) < 0) {
        array.push(template.slice(offset));
        break;
      }
      if ((end = template.indexOf('}', start+2)) < 0) {
        // この場合は文法エラーなので以後の置換処理は行わない
        array.push(template.slice(offset));
        break;
      }
      array.push(template.slice(offset, start));
      xmlkey = template.slice(start+2, end);
      array.push(getXmlValue(xmlkey, xml));
    }
    return array.join('');
  }

  var dictionary;  // プレースホルダ名とXMLデータの対応表 (キャッシュ)

  /**
   * プレースホルダ名に対応するXMLデータを求める．
   * ツリーを何度もたどることを避けるため一度だけたどってキャッシュを作る．
   */
  function getXmlValue(key, xml) {
    if (!dictionary) {
      dictionary = {};
      walkTree(dictionary, xml);
    }
    return dictionary[key];
  }

  /**
   * ツリーノードをたどってプレースホルダ名とXMLデータの対応表を作成する．
   */
  function walkTree(dic, $nodes, name) {
    name = name || "";
    var node, children, part, newname, n;
    var array = $nodes.length >= 2 && $nodes[0].nodeName === $nodes[1].nodeName;
    for (n = 0; n < $nodes.length; n++) {
      node = $nodes[n];
      part = node.nodeName;
      if (array)
        part += "[" + n + "]";
      newname = name.length <= 0 ? part : name + "." + part;
      if (node.childElementCount === 0 && node.textContent) {
        //console.log(newname + " : " + node.textContent);
        dic[newname] = node.textContent;
      }
      children = $(node).children();
      if (children)
        walkTree(dic, $(children), newname);
    }
  }

  $.templateString = toTemplateString;

  /**
   * テンプレートデータの文字列表現を返す．
   */
  function toTemplateString(map, eol) {
    eol = eol || "\n";
    var array = [];
    for (var id in map) {
      array.push("id=" + id + " value=" + eol + map[id]);
    }
    return array.join('');
  }

  //-------------------------------------------------------------------------

  $.xmlString = toXmlString;

  /**
   * XMLデータの整形された文字列表現を返す．
   *
   * 改行コードとインデント文字列をカスタマイズできる．
   * デフォルトの改行コードは"\n"であり，インデントは１レベル当たりスペース
   * １個である．
   *
   * 【使い方】
   *   $.ajax({
   *     url: "xml/abcd.xml",
   *     type: "GET",
   *     dataType: "xml",
   *     error:
   *       function () {
   *         alert("Error: cannot get XML data");
   *       },
   *     success:
   *       function (xml) {
   *         // 引数 xml は Document であり Element ではない．
   *         // xml.firstChild は Element である．
   *         var s = toXmlString($(xml.firstChild));
   *         console.log(s);
   *       }
   *   });
   *
   * 【備考】
   *   $kids = $(node).children(); を使うとテキストノードが抽出されない．
   */
  function toXmlString(nodes, options, level) {
    var array = [];
    var node, $kids, name, text, attrs, attr, i, n, indent = '';
    options = options || { eol: "\n", indent: " " };
    level = level || 0;
    for (n = 0; n < level; n++)
      indent += options.indent;

    for (i = 0; i < nodes.length; i++) {
      node = nodes[i];
      switch (node.nodeType) {
      case 1:  // Element
        name = node.nodeName.toLowerCase();
        attrs = '';
        if (node.attributes) {
          for (n = 0; n < node.attributes.length; n++) {
            attr = node.attributes[n];
            attrs += ' ' + attr.nodeName + '="' + attr.nodeValue + '"';
          }
        }
        array.push(indent + '<' + name + attrs + '>' + options.eol);
        $kids = $(node).contents();
        $kids.each(function () {
          array.push(toXmlString($(this), options, level+1));
        });
        array.push(indent + '</' + name + '>' + options.eol);
        break;
      case 3:  // Text
        text = $.trim(node.nodeValue);
        if (text.length > 0)
          array.push(indent + text + options.eol);
        break;
      default:
        break;
      }
    }
    return array.join('');
  }

})(jQuery, window, document);
