

var Handlebars = require("handlebars");

 Handlebars.registerHelper('app_is_options', function (value) {
        return value.includes("options");
      });
;

Handlebars.registerHelper('app_is_popup', function (value) {
    return value.includes("popup");
  });
;

Handlebars.registerHelper('app_is_content_scripts', function (value) {
    return value.includes("content_scripts");
  });
;