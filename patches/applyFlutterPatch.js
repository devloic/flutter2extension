const diff_match_patch = require('diff-match-patch');
const fs   = require('fs');

const dmp = new diff_match_patch();


const flutter_orig2 = fs.readFileSync('../build/unpacked-build/content_scripts/js/flutter.js.orig').toString();

console.log(process.cwd())
const patch2 = fs.readFileSync('./patch_flutter.txt').toString();
var patches2 =dmp.patch_fromText(patch2);

var flutter_patched2=dmp.patch_apply(patches2, flutter_orig2);
fs.writeFileSync("../build/unpacked-build/content_scripts/js/flutter.js",flutter_patched2[0]);

