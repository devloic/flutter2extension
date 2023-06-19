const fs   = require('fs');


module.exports = {

  manualDartPatch: function () {

const apps=fs.readdirSync("../build/unpacked-build/content_scripts/apps/", { withFileTypes: true });
apps.forEach(element => {
    


const main_orig2 = fs.readFileSync(element.path+element.name+'/main.dart.js.orig').toString();

var replacewith1=`(function dartProgram() {
    //lolopatch
    function getAppName(){
      var appname=document.currentScript.src.substring(document.currentScript.src.indexOf("/content_scripts/apps/")+"/content_scripts/apps/".length)
                appname=appname.replace("/","").replace("main.dart.js","");
                return appname;
    }
      //ENDlolopatch
    function copyProperties(from, to) {
`;

var replace1=`(function dartProgram() {
  function copyProperties(from, to) {`;
var finalContent=main_orig2.replace(replace1,replacewith1);

var replace2=`self.window.console.debug("Flutter Web Bootstrap: Programmatic.");
              loader.didCreateEngineInitializer(bootstrap.prepareEngineInitializer$0());`;

var replacewith2=`self.window.console.debug("Flutter Web Bootstrap: Programmatic.");
              //lolopatch
               var engine=bootstrap.prepareEngineInitializer$0();
               engine.appname=getAppName();
               loader.didCreateEngineInitializer(engine);
              //ENDlolopatch
              `;

finalContent=finalContent.replace(replace2,replacewith2);


              var replace3=`    AssetManager: function AssetManager(t0) {
      this._assetBase = t0;`;
                var replacewith3=`AssetManager: function AssetManager(t0) {
                    //lolopatch
                   //this._assetBase = t0;
                   var appname=getAppName();
                   var assetBase=document.querySelector("base2").getAttribute("href")+appname+"/";
                   this._assetBase=assetBase;
                   //ENDlolopatch`;

                   finalContent=finalContent.replace(replace3,replacewith3);


fs.writeFileSync(element.path+element.name+"/main.dart.js",finalContent);


});

}
};