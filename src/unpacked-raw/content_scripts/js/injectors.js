function getMaxZIndex() {
  return Math.max(
    ...Array.from(document.querySelectorAll('body *'), el =>
      parseFloat(window.getComputedStyle(el).zIndex),
    ).filter(zIndex => !Number.isNaN(zIndex)),
    0,
  );
}

//SIDEBAR
 function injectSidebar(app){
  var max=getMaxZIndex();
if(jQuery('#sidebar').length==0){


    jQuery('body').wrapInner(`
<div id="content" class="p-4 p-md-5 pt-5"></div>
`);
jQuery('body').prepend(`
<nav id="sidebar" class="order-last" class="img" style="z-index:`+max*10+`;background-image: url(`+chrome.runtime.getURL(
  "content_scripts/components/sidebar/images/bg_1.jpg")
 +`);">
<div class="custom-menu">
    <button type="button" id="sidebarCollapse"  class="btn btn-primary">
    </button>
</div>
<div id="flutter_app-`+app.id+`" style="width:280px;height:480px;margin:auto;margin-top:200px" >

</div>
</nav>
`);
jQuery('body').wrapInner(`
<div class="wrapper-sidebar-wrapper d-flex align-items-stretch"></div>
`);




(function($) {

	"use strict";

	var fullHeight = function() {

		$('.js-fullheight').css('height', $(window).height());
		$(window).resize(function(){
			$('.js-fullheight').css('height', $(window).height());
		});

	};
	fullHeight();

	$('#sidebarCollapse').on('click', function () {
      $('#sidebar').toggleClass('active');
  });

})(jQuery);

}else{

    jQuery("#sidebar").append(`
<div id="flutter_app-`+app.id+`" style="width:280px;height:480px;margin:auto;margin-top:200px" ></div>
    `);

}

};



//INJECTSTICKY
            
async function injectSticky(app){
var js_src ="";
js_src = chrome.runtime.getURL("/content_scripts/js/sticky.js");
await import(js_src);

	$("body").append(`
<div id='widget-area-`+app.id+`' style='z-index: 10000000000000000;max-width: 700px; max-height: 700px;width: 40vh;'>

<div class='test-widget' id='test-widget-2-`+app.id+`' style='padding:0px;z-index: 10000000000000000;'>

<div id='flutter_app-`+app.id+`' class='flutter_app example-sticky-notes' style='height:0px;width:0px;z-index: 10000000000000000;' >

</div>
</div>
</div>
`)
var position = $("#test-widget-2-"+app.id).offset();
var width_screen=$(window).width();
var width_el=$("#widget-area-"+app.id).width();


$("#test-widget-2-"+app.id).css("position","relative").css("left",width_screen-width_el+"px").css("top","-"+position.top+"px");    

    // Make the widgets draggable:
    // start function just makes the currently dragged widget have a greater z-index than the other widget
    // stop function just updates a simple counter, used to illustrate event bubbling on note drag stop function.
    $("#widget-area-"+app.id+' .test-widget').draggable({
      cancel: '.sticky-note-area__container',
      start: function(e, ui) { 
        var z = 1;
        $("#widget-area-"+app.id+ ' .test-widget').each(function() { 
          if ($(this)[0] != e.target) { 
            var tz = $(this).css('z-index');
            if (tz> z) z = tz;
          }
        });
        z++;
        $(e.target).css('z-index', z);
      },
      stop: function(e, ui) { 
        var e = $(this).find('.wdc');
        
        if (!e.length) { 
          e = $('<div class="wdc" data-wdc="0"></div>'); 
          e.appendTo($(this)); 
        }
        var wdc = Number(e.data('wdc')) + 1;
        //e.html('Widget Drag Count = ' + wdc);
        e.data('wdc',wdc);
        
      }
    });

    // Initialize the sticky notes inside the second widget
    $('#flutter_app-'+app.id).stickynotes({
       noteAreaWidth: '21vw',
       noteAreaHeight: '50vh',
       noteWidth: '300px',
       noteHeight: '300px',
       noteOffset: 50,
       noteRotatable: false
    });
    

}



//ENDINJECTSTICKY


//INJECTWINBOX
async function injectWinbox(app){
  
  var js_src ="";
  js_src = chrome.runtime.getURL("/content_scripts/js/winbox.js");
  await import(js_src);



  var winbox = new WinBox({
    id:"winbox-"+app.id,
    title: app.name,
    width:370,
    height : 600,
    x :   window.innerWidth-370-10-app.index*10,
    y: 0+app.index*15,
    class: "modern no-animation	",
    index: getMaxZIndex()+1,
     onfocus:function(){
      var winbox=document.querySelector("#"+this.id);
      if ( winbox != null){
        winbox.style.setProperty('z-index"', getMaxZIndex()+1);
      }
     }

}); 


var div = document.createElement("div");
div.id="flutter_app-"+app.id;
div.classList.add("flutter_app");
//div.style.zIndex="10000000000000000";
div.style.height="93%";
div.style.width="100%";
div.style.border="0px solid";
div.style.marginTop="35px";
div.style.paddingLeft="5px";
div.style.paddingRight="5px";

winbox.body.appendChild(div);

}
//ENDINJECTWINBOX

export { injectSidebar,injectSticky,injectWinbox};