const yaml = require('js-yaml');
const fs   = require('fs');
const path   = require('path');
const subProcess = require('child_process')
const fse = require('fs-extra');
const diff_match_patch = require('diff-match-patch');

const patch = require('../patches/applyMainPatch');

// Get document, or throw exception on error
try {
  const rawdata = fs.readFileSync('../config.json');
  let projects = JSON.parse(rawdata);

  //run builds
  

   run_flutter_web_builds(projects.project);
  copyAllApps(projects.project);

} catch (e) {
  console.log(e);
}



  function run_flutter_web_builds(projects){
  var commands="";
  for (const project of projects) {
  
        var doc= yaml.load(fs.readFileSync(project.pubspec_path, 'utf8'));
           
            var project_dir=path.dirname(project.pubspec_path);
            commands+="cd "+project_dir+";flutter build web --web-renderer html --csp --profile & ";
          };           
            //'flutter build web --web-renderer html --csp --profile --base-href /titittotot/sdsd/'
       
         
          try {
            let res= subProcess.execSync(commands);
             console.log("NO ERROR")
             console.log(res.toString())
             
          }
          catch (err){ 
            console.log("output", err)
            console.log("sdterr",err.stderr.toString())
          }


         /*   var ls =subProcess.spawnSync('flutter', ['build', 'web' ,'--web-renderer' ,'html' ,'--csp' ,'--profile'],{cwd: project_dir}
              );
              console.log (ls.output.toString('utf8') ) */

             


}

function copyApp(dest,project){
  var project_dir=path.dirname(project.pubspec_path);

    fse.ensureDirSync("../build/unpacked-build/"+dest+"/apps/"+project.id);
    var srcDir = project_dir+"/build/web/assets";
     var assetsDir = "../build/unpacked-build/"+dest+"/apps/"+project.id+"/assets/";
     var extProjectDir = "../build/unpacked-build/"+dest+"/apps/"+project.id+"/";

     try {
          //copy assets
          fse.copySync(srcDir, assetsDir);
          //copy main.dart.js
          
         
          
          if(dest=="content_scripts"){
          

            if (fse.existsSync(extProjectDir+"/main.dart.js.orig"))
            {
              fse.rmSync(extProjectDir+"/main.dart.js.orig");

            }
            fse.copySync(project_dir+"/build/web/main.dart.js", extProjectDir+"/main.dart.js.orig");
        

              fs.readdirSync(project_dir+"/build/web").forEach(file => {
                if (file.endsWith('.part.js')) {
               
                  fse.copy(`${project_dir+"/build/web/"}/${file}`, extProjectDir+`/${file}`)
                   .catch(err => console.error(err));
                }
              });
            

            patch.manualDartPatch();
         }else{
            fse.copySync(project_dir+"/build/web/main.dart.js", extProjectDir+"/main.dart.js");
            fse.copySync(project_dir+"/build/web", extProjectDir, { filter: filterFunc });
         }
          //copy flutter.js
          if(dest=="content_scripts"){

          

            fse.copySync(project_dir+"/build/web/flutter.js", extProjectDir+"../../js/flutter.js.orig");
            const dmp2 = new diff_match_patch();
            const flutter_orig = fs.readFileSync(extProjectDir+"../../js/flutter.js.orig").toString();
            const flutter_patch = fs.readFileSync('../patches/patch_flutter.trustedUrl.txt').toString();
            var patches =dmp2.patch_fromText(flutter_patch);
            var flutter_patched=dmp2.patch_apply(patches, flutter_orig);
            fs.writeFileSync(extProjectDir+"../../js/flutter.js",flutter_patched[0]);
          }else{
            fse.copySync(project_dir+"/build/web/flutter.js", extProjectDir+"../../../commons/flutter.js");

          }

      console.log('success!')
    } catch (err) {
      console.error(err)
    }


}

function copyAllApps(projects){
  for (const project of projects) {
    var project_dir=path.dirname(project.pubspec_path);

      if (project.target.includes("options")){
        copyApp("options",project);
      }


    if (project.target.includes("popup")){
      copyApp("popup",project);
    }

    if (project.target.includes("content_scripts")){
      copyApp("content_scripts",project);
    }


  };
}