# Features

- bundle several web enabled Flutter apps inside a browser extension, these apps get injected in webpages
- define where the app will be shown : inside a sidebar or a window ( winbox) for content scripts, in options or popup ( you can have an app appear in all presentation targets )

# Check the demo :  

[![Flutter2extension on Youtube](http://img.youtube.com/vi/OWs5GaYO2FM/0.jpg)](http://www.youtube.com/watch?v=OWs5GaYO2FM "Flutter2extension")

# Get started

- install npm ( https://docs.npmjs.com/downloading-and-installing-node-js-and-npm )
- clone flutter2extension : git clone https://github.com/devloic/flutter2extension
- edit config.json adding one or more apps
  ```
  {
    "projects":
        [{
            "git":"https://github.com/Roaa94/flutter_airbnb_ui",
            "pubspec_path": "",
            "target":["content_scripts","options","popup"],
            "presentation":["winbox"],
            "id":"flutter_airbnb_ui",
            "name":"flutter_airbnb_ui"
        }
        ]
    
}
```
set "git" if your source code is hosted on a git repository
set "pubspec_path" if the app is in a directory : /Users/lolo/development/flutter_project/my_flutter_app/pubspec.yaml
set "target" to specify where the app will show up , ex : ["content_scripts","popup"] if you want it to be injected in pages
via content scripts and show as a popup when you click on the extension's icon
set "presentation" ( only needed for  "content_scripts") : app will show in a "sidebar" or a "winbox" draggable window
set "id" to a unique id ( mandatory, could be the name of your repo)
set "name" : label of your app that will appear in tabs, winbox title...

if your Flutter app was not made for the web you can still try to add web support: flutter create --platforms web .  ( inside your flutter project)
you can check if the Flutter app works on chrome with: flutter run -d chrome  (inside your flutter project)

Once config.json is set:

cd grunt
npm install
grunt allin2

your can find the unpacked browser extension in : ./flutter_to_browser_extension/dist/unpacked
inside your chrome based browser go to extensions, set developer mode and click "Load unpacked" and select the flutter_to_browser_extension/dist/unpacked folder
refresh some webpage, the Flutter app should show up

flutter2extension is pretty stable but it will break many webpages (CSS collision) and some flutter apps might not work as expected (CORS), if that happens open a different webpage for testing. This will get fixed. Until flutter2extension gets more dynamic configuration settings don't consider it as a user-friendly tool. I am working on making it more suitable for every day user work. Consider it as an advanced proof of concept for now.






Package flutter apps in a browser extension (chrome)

While adding a flutter web enabled app to a chrome extension is a relatively easy [process](https://medium.com/flutter-community/building-a-chrome-extension-using-flutter-aeb100a6d6c) , the tutorials on the web only achieve including them as a popup view.

flutter2extension gives you the choice to package your flutter apps inside the extension's:  
- options  
- popup  
- content_scripts  

Why package apps in an extension?

Because it allows developers to easily distribute and showcase their apps with a ready-to-run app package. No hosting required.

As a developer how many times did you watch a tutorial about an app on youtube, click on the github repo link in the comments, clone the repo, add it to your IDE and then find out that it didn't build because packages were outdated, some configuration file were missing etc etc. We should be able to easily test an app without having to build it before. Embedding an app within content_scripts makes it possible for the app to inject code/content inside webpages. This opens a new level of functionalities and ... opportunities.

On the google webstore we have one app <=> one extension. flutter2extension can bundle multiple flutter apps inside one extension. While flutter2extension is in early stage, it was already able to run several flutter apps side by side in a same webpage. Your browser becomes a personal local application server you control.

# TODO Next
- isolate apps and webpages to avoid CSS collisions
- disable CORS when needed ( configurable)
- generate a settings page for each app so you can dynamically add API keys (this avoids having to set it in the source code)
- restrict apps to relevant pages in config.json
- persist and override settings in your own appwrite instance
- dynamically change app embedding : move app from sidebar to winbox and vice versa


# Future challenges:

- bypass the  google "webstore" with a custom package manager so you can install apps in your browser like you would install a module with npm, a linux app with apt
  => for now you can pull apps directly from git repos
- embed apps made with other frameworks: react, vue, etc ...
- speed app development through modular app design and interoperability between apps, think of apps as a service
- since injecting code and content might break pages and pages structure might change we need apps that can dynamically configure themselves with configurations rated and shared by the user community
- this project aims to create an ecosystem managed by an open source community which hopefully will generate the trust and transparency needed for user adoption
- focus on apps that offer crowdsourcing capabilities to engage collective intelligence instead of IA, let's prove that we can be faster and more accurate
- Interested? Get in touch : devloic@gmail.com

Loïc
