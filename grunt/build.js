const yaml = require('js-yaml');
const fs   = require('fs');
const path   = require('path');
const subProcess = require('child_process')
const fse = require('fs-extra');
const diff_match_patch = require('diff-match-patch');
const debug = require('debug');
//debug.enable('simple-git,simple-git:*');


const { simpleGit, SimpleGit,CleanOptions,SimpleGitOptions } = require('simple-git');
simpleGit().clean(CleanOptions.FORCE);

const patch = require('../patches/applyMainPatch');
const startDir=process.cwd();

// Get document, or throw exception on error
try {
  const rawdata = fs.readFileSync('../config.json');
  let config = JSON.parse(rawdata);

  //run builds
   run_flutter_web_builds(config.projects).then(()=>{
      copyAllApps(config.projects);
   });

} catch (e) {
  console.log(e);
}

function getProjectDir(project){
  var project_dir="";
 
  if (typeof project.git =="undefined" || project.git ==""){
    project_dir=path.dirname(project.pubspec_path);
 }else{
      var git_subdir="";
      if (typeof project.git_subdir !=="undefined" && project.git_subdir !==""){
          git_subdir=project.git_subdir;
          var bname= path.basename(project.git, '.git');
          project_dir=process.cwd()+"/../git-projects/"+bname+"/"+git_subdir;
      }else{
        var bname= path.basename(project.git, '.git');
        project_dir=process.cwd()+"/../git-projects/"+bname;
      }
  }

  return project_dir;
}

  async function run_flutter_web_builds(projects){
  var commands="";
  for (const project of projects) {
  
    var project_dir="";          
    if (project.target.length>0 && project.target[0] != ""){

      project_dir=getProjectDir(project);
        
      if (typeof project.git !=="undefined" && project.git !==""){
        try {
                
                  if (project.subdir !=="undefined" && project.subdir !==""){
                    
                   var bname= path.basename(project.git, '.git');
                  git_dir=startDir+"/../git-projects/"+bname;
                   if (!fs.existsSync(git_dir)){
                    console.log("git clone "+project.git+ " in "+startDir+"/../git-projects/\n")
                    var cwd=process.cwd();
                    process.chdir(startDir+"/../git-projects/");
                    await simpleGit().clone(project.git);
                    process.chdir(cwd);
                    console.log("done\n");
                   }else{
                    console.log(project_dir+" already exists");
                   }
                  }else{
                    if (!fs.existsSync(project_dir)){
                    console.log("git clone "+project.git+ " in "+project_dir+"\n")
                    await simpleGit().clone(project.git,project_dir);
                    console.log("done\n");
                  }   else{
                    console.log(project_dir+" already exists");
                  }

                  }
                    
              
            } catch (error) {
              console.log(error);
            }     
          }      
    
       commands+="cd "+project_dir+";flutter build web --web-renderer html --csp --profile  & \n";
     } 
  };          
  console.log(commands);

  
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

  var project_dir=getProjectDir(project);
console.log(project_dir);
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
         }else
         {
            fse.copySync(project_dir+"/build/web/main.dart.js", extProjectDir+"/main.dart.js");
            fs.readdirSync(project_dir+"/build/web").forEach(file => {
              if (file.endsWith('.part.js')) {
             
                fse.copy(`${project_dir+"/build/web/"}/${file}`, extProjectDir+`/${file}`)
                 .catch(err => console.error(err));
              }
            });
         }
          //copy flutter.js
          if(dest=="content_scripts"){
console.log(project_dir  );
console.log(extProjectDir  );
       

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