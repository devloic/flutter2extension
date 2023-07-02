# Features

- bundle several web enabled flutter apps inside a browser extension, these apps get injected in webpages
- define

Check flutter2extension demo :  


[![Flutter2extension on Youtube](http://img.youtube.com/vi/OWs5GaYO2FM/0.jpg)](http://www.youtube.com/watch?v=OWs5GaYO2FM "Flutter2extension")



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
