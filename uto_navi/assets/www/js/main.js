/******************************/
/*  共通設定（bind時の処理)
/******************************/
$(document).bind("mobileinit", function() {
	/* 戻るボタンの共通設定  */
	//$.mobile.page.prototype.options.addBackBtn = true;
	//$.mobile.page.prototype.options.backBtnText = "BACK";

	/* Ajaxでのページ取得に失敗した場合のメッセージ  */
	$.mobile.pageLoadErrorMessage = "ページの取得に失敗しました。";
	
	/* リンククリック時にAjaxする  */
	//$.mobile.ajaxEnabled = true;
	
	/* デフォルトのAjaxページ遷移のトランジション  */
	//$.mobile.defaultTransition = "slide";
});


$(function() {

	/* 変数定義  */
	var line = {};
	var map;
	var latlng;
	var animate;

	var currentWindow = null;

	var busstop_id = [];
	var busstop_name = {};
	var busstop_position = {};
	var busstop_image = {};
	var busstop_image_width = {};
	var busstop_image_height = {};
	var busstop_message = {};
	
	/* アニメーションのシンボル定義  */
	var lineSymbol = {
		path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
		scale: 6
	};

	/* XMLファイルからバス停情報を取得する  */		
    $.ajax({
        type:'GET',
        url:'xml/config.xml',
        dataType:'xml',
        async: false,
        timeout:1000,
        error:function() {
            alert("バス停情報読み込み失敗");
        },
        success:function(xml){
        	/* キー配列にバス停情報を格納 */
            $(xml).find("entry").each(function() {
            	busstop_id.push($(this).find('id').text());
            	busstop_name[$(this).find('id').text()] = $(this).find('name').text();
            	busstop_position[$(this).find('id').text()] = new google.maps.LatLng($(this).find('latitude').text()
            									                                    ,$(this).find('longitude').text());
        		busstop_image[$(this).find('id').text()] = $(this).find('image').text();
        		busstop_image_width[$(this).find('id').text()] = $(this).find('image_width').text();
        		busstop_image_height[$(this).find('id').text()] = $(this).find('image_height').text();
        		busstop_message[$(this).find('id').text()] = $(this).find('message').text();
            });
        }
    });



	/* HTMLをXMLファイルのバス停設定情報を元に動的に生成する  */
	var strHtml = "";
	 	
	for(var i = 0; i < busstop_id.length; i++){
		/* ListviewのHTMLを生成 */
		/* 分類項目の生成 */
		if(busstop_id[i].substr(0,4) == "type"){
			if(i != 0){
				strHtml += '</ul></div>';
			}
			strHtml += '<div data-role="collapsible" data-theme="f">' +
			           '<h3><font color="#2180c4"><b>' + busstop_name[busstop_id[i]] + '</b></font></h3>' +
			           '<ul data-role="listview">';
		}
		
		/* データ項目の生成 */
		if(busstop_id[i].substr(0,4)  != "type"){
			strHtml += '<li><a href="#' + busstop_id[i] + '" id="" data-transition="slide">' + busstop_name[busstop_id[i]] +
			           '</a></li>';
		}

		if(i == busstop_id.length-1){
			strHtml += '</ul></div>';
		}



		/* 詳細ページのHTMLを生成 （分類項目以外の場合）*/
		if(busstop_id[i].substr(0,4)  != "type"){
			$('<div id="' + busstop_id[i] + '" data-role="page" data-add-back-btn="true" data-back-btn-text="BACK" data-theme="g">' +
				'<div data-role="header" id="header" data-position="fixed" data-theme="g">' +
				  '<h1>' + busstop_name[busstop_id[i]] + '</h1>' +
				'</div>' +
				'<ul data-role="listview">' +
				  '<li><a href="#">' + busstop_message[busstop_id[i]] + '</a>' +
				  	  '<a href="#map" id="' + busstop_id[i] + '" data-icon="search"></a>' +
				  '</li>' +
				'</ul>' +
			  '</div>').appendTo(document.body);
		}
		
	}
		$(strHtml).appendTo("#busstop_list");
		console.log(strHtml);

	/********************************************/
	/*  地図ページ初回起動時の処理
	/********************************************/
	$(document).on('pageinit', '#map', function() {

		// マップ領域のサイズを設定
		var pageHeight = $(document).height() - 90;
		$("#map_zone").css("height",pageHeight);
	});

	/********************************************/
	/*  地図ページを開くときの処理（毎回）
	/********************************************/
	$(document).on('pageshow', '#map', function() {
	    initialize();
	});

	/*********************************/
	/*  初期化処理(initialize関数)
	/*********************************/
	function initialize() {
	


		var latitude;
		var longitude;
		var params = $('#map').data('place_id');
		
		if(params==""){
			return;
		} else if(params=="map"){
			// 本町交差点を中心地に設定
			latlng = new google.maps.LatLng(32.684963, 130.660887);
		} else {
			// パラメータ値の場所を中心地に設定
			latlng = busstop_position[params];
		}
		
		var options = {
			zoom:16,
			center:latlng,
			mapTypeId:google.maps.MapTypeId.ROAD
			};

		// 地図を取得	
		map = new google.maps.Map(document.getElementById("map_zone"),options);
		

		// カスタマイズアイコンの配置
		for( var i = 0 , busstop_len = busstop_id.length ; i < busstop_len ; i++ ) {
			
			var latlng = busstop_position[busstop_id[i]];
			var message = busstop_message[busstop_id[i]];
			var id = busstop_id[i];
			var name = busstop_name[busstop_id[i]];
			var image = busstop_image[busstop_id[i]];
			var image_width = busstop_image_width[busstop_id[i]];
			var image_height = busstop_image_height[busstop_id[i]];
			
			if(id.substr(0,4) != "type"){
				/* 関数createMarkerでカスタマイズアイコンを作成 */
				createMarker(latlng, message, id, name, image, image_width, image_height, map);
			}
		}

		// ルートを地図上に描く
		makeRouteline('xml/route1.xml', 'line1', '#7cc8fd', 1.0, 5);
		makeRouteline('xml/route2.xml', 'line2', '#f589b5', 1.0, 5);
		makeRouteline('xml/route3.xml', 'line3', '#f589b5', 1.0, 5);

		$('#map').data('place_id', "");
	}	

	/*********************************/
	/*  中心地移動(mapMove関数)
	/*********************************/
	function mapMove() {

		var params = $('#map').data('place_id');
		
		if(params==""){
			// 何もしない
		} else {
			// パラメータ値の場所を中心地に設定
			latlng = busstop_position[params];
			map.panTo(latlng);
		}
		
	}

	/*************************************/
	/*  現在地を表示(クリックイベント)
	/*************************************/
	$("#myplace").click(function() {
		navigator.geolocation.getCurrentPosition(function(position){

			var latitude = position.coords.latitude;   // 緯度
			var longitude = position.coords.longitude; // 経度
			latlng = new google.maps.LatLng(latitude, longitude);
			// 現在地に移動
			map.panTo(latlng);

			// マーカーの配置
			var Marker = new google.maps.Marker({
				position: latlng,
				map: map,
				title: "現在地"
			});
		}, onError);
	})	



	/********************************************/
	/*  循環線内回りルート案内(クリックイベント)
	/*********************************************/
	$("#in-route").click(function() {

		// 内回りルートの線を強調する
		line['line1'].set("strokeOpacity", 1.0);
		line['line2'].set("strokeOpacity", 0.2);
		line['line3'].set("strokeOpacity", 0.2);		

		// アニメーション関数を呼び出す	
		animateCircle('line1');
	
	})

	/********************************************/
	/*  循環線外回りＡルート案内(クリックイベント)
	/********************************************/
	$("#out-routeA").click(function() {

		// 外回りルートの線を強調する
		line['line1'].set("strokeOpacity", 0.6);
		line['line2'].set("strokeOpacity", 1.0);
		line['line3'].set("strokeOpacity", 1.0);		

		// アニメーション関数を呼び出す	
		animateCircle('line2');

	})

	/********************************************/
	/*  循環線外回りＢルート案内(クリックイベント)
	/********************************************/
	$("#out-routeB").click(function() {

		// 外回りルートの線を強調する
		line['line1'].set("strokeOpacity", 0.6);
		line['line2'].set("strokeOpacity", 1.0);
		line['line3'].set("strokeOpacity", 1.0);		
		
		// アニメーション関数を呼び出す	
		animateCircle('line3');

	})

	/********************************************/
	/*  ルート案内を停止(クリックイベント)
	/********************************************/
	$("#routeStop").click(function() {

		// アニメーションを止める	
		clearTimeout(animate);

	})

	/*************************************************/
	/*  バス停検索のSearchアイコンから地図を表示
	/*  クリックしたリンクのID属性を取得
	/*************************************************/
	$('a[href=#map]').click(function() {
	    var place_id = $(this).attr("id");
	    $('#map').data('place_id', place_id);    
	})


	/**************************************************/
	/*  カスタマイズアイコンの設置(createMarker関数)
	/**************************************************/
	function createMarker(latlng, message, id, name, image, image_width, image_height, map) {

		// infoWindowクラスのオブジェクトを作成
		var infoWindow = new google.maps.InfoWindow();

		// カスタマイズアイコンを作成
		var marker = new google.maps.Marker({
			position: latlng,
			map: map,
			title: name,
			icon: icon = new google.maps.MarkerImage(
				image,
				new google.maps.Size(parseInt(image_width),parseInt(image_height)),
				new google.maps.Point(0,0),
				new google.maps.Point(0,parseInt(image_height))
				)
				
		});

		// addListener を使ってイベントリスナを追加
		// 地図上のmarkerがクリックされると｛｝内の処理を実行
		google.maps.event.addListener(marker, 'click', function() {
			// アイコンクリック時に時刻表ページを表示
			$.mobile.changePage( "#" + id , { transition: "pop"} );
		});
	}
	
	
	/**************************************************/
	/*  ルートの線引き(makeRouteline関数)
	/*  引数	xmlPath: xmlファイルの格納場所	
	/*		No 	   : 'line1' or 'line2' or 'line3' 
	/*		color  : lineの色
	/*		opacity: 透明度(0～1.0) ※0が透明
	/*		weight : lineの太さ 
	/**************************************************/
	function makeRouteline(xmlPath, No, color, opacity, weight) {

		var route = [];

		// XMLファイルからルート情報を取得する
	    $.ajax({
	        type:'GET',
	        url: xmlPath,
	        dataType:'xml',
	        async: false,
	        timeout:1000,
	        error:function() {
	            alert("ルート読み込み失敗");
	        },
	        success:function(xml){
	        	// 配列に位置情報を格納
	            $(xml).find("entry").each(function() {
	            	route.push(new google.maps.LatLng($(this).find('latitude').text()
	            									 ,$(this).find('longitude').text()));
	            });
	        }
	    });

		// ポリラインの削除
		if(line[No]==null){
			//何もしない		
		} else {
			line[No].setMap(null);	
		}

		line[No] = new google.maps.Polyline({
		    path: route,
		    strokeColor: color,
		    strokeOpacity: opacity,
		    strokeWeight: weight,
		    map: map
		});
	}



	/*********************************************/
	/*  ルートアニメーション(animateCircle関数)
	/*  引数　No : 'line1' or 'line2' or 'line3'
	/*********************************************/
	function animateCircle(No) {

		// フレームレート
		var rate = 15;
		
		// アイコンの形状を設定
		line[No].setOptions({
		 	icons: [{
			icon: lineSymbol,
			offset: "100%"
		    }]
		});
		
		// インターバルの初期化
		clearTimeout(animate);
		animate = null;
		var count = 0;
		
		//　アニメーションの開始
/*		animate = setInterval(function() {
			count = (count + 1) % 400;
			var routeicons = line[No].get("icons");
			routeicons[0].offset = (count / 4) + "%";
			line[No].set("icons", routeicons);
		}, 20);
*/		
		(function() {
			count = (count + 1) % 400;
			var routeicons = line[No].get("icons");
			routeicons[0].offset = (count / 4) + "%";
			line[No].set("icons", routeicons);
		
		    // 無名関数を繰り返して実行するタイマー
		    // 1000 / rateミリ秒ごとに実行する
	    	animate = setTimeout(arguments.callee, 1000 / rate);
	    }) ();
 	}


	/**********************************/
	/*  エラー時の記述(onError関数)
	/**********************************/
	function onError(error) {
		alert('コード：　'	+ error.code + '\n' +
			  'メッセージ：　' + error.message + '\n');
	}
		
});