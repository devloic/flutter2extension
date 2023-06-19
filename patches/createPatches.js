const diff_match_patch = require('diff-match-patch');
const fs   = require('fs');

const dmp = new diff_match_patch();

function createPatch(text1, text2) {
    if (!text1 && text1 === '') return undefined;
    const patches = dmp.patch_make(text1, text2);
    const patch = dmp.patch_toText(patches);
    return patch;
}
 const flutter_patched = fs.readFileSync('../build/unpacked-build/content_scripts/js/flutter.js').toString();
const flutter_orig = fs.readFileSync('../build/unpacked-build/content_scripts/js/flutter.js.orig').toString();

var patch = createPatch(flutter_orig, flutter_patched);
fs.writeFileSync("./patch_flutter3.txt",patch);

console.log("patch written") 
/*
const main_patched = fs.readFileSync('../build/unpacked-build/content_scripts/apps/flutter_music_app_ui/main.dart.js').toString();
const main_orig = fs.readFileSync('../build/unpacked-build/content_scripts/apps/flutter_music_app_ui/main.dart.js.orig').toString();

var patch = createPatch(main_orig, main_patched);
fs.writeFileSync("./patch_main_dart.txt",patch);
*/