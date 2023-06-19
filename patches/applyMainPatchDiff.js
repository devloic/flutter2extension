//TODO
//LOOP ON APPS
const diff_match_patch = require('diff-match-patch');
const fs   = require('fs');


const dmp = new diff_match_patch();

const apps=fs.readdirSync("../build/unpacked-build/content_scripts/apps/", { withFileTypes: true });
apps.forEach(element => {

const main_orig2 = fs.readFileSync(element.path+element.name+'/main.dart.js.orig').toString();


const patch2 = fs.readFileSync('./patch_main_dart.txt').toString();
var patches2 =dmp.patch_fromText(patch2);

var main_patched2=dmp.patch_apply(patches2, main_orig2);
fs.writeFileSync(element.path+element.name+"/main.dart.js",main_patched2[0]);


});