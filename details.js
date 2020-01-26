var dojoConfig = {
  parseOnLoad: true
};
"use strict";    
  
var restServiceUrl = 'https://services1.arcgis.com/UGWyiCIH2BDelPqy/arcgis/rest/services/FFPropertiesClients/FeatureServer/0/';
var outFields = '*';
var urlParams = new URLSearchParams(window.location.search); // gets all URL parameters

  function validURL(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
      '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(str);
  }

  function esriDate(eObj){
    if (!isNaN(eObj)) {
      var myDate = new Date(eObj);
      return myDate.toLocaleString().split(', ')[0];
    } else {
      return eObj;
    }
    
  }
  // Called to update form

  function FastFacilityForm(response){  // Only executes after response from server
     
    console.log(response.data.features);
    // this only processes the first returned record [0]
    for (var key in response.data.features[0].attributes) {
      if (urlParams.get('debug') == "true") {  // outputs all fields in error section
        tableCode = "";
          tableCode += "<div><span class='fieldlabel' id='"+key+"label'>"+key+"</span>&nbsp;:&nbsp;"; // label
          //tableCode += "<span class='fieldvalue' id='"+key+"val'>:"+response.data.features[0].attributes[key]+"</span></div>"; // value
          tableCode += "<span class='fieldvalue' id='"+key+"val'></span></div>"; // value
          document.getElementById("error").innerHTML += tableCode;
          console.log(tableCode);
        };
        
        if (urlParams.get('nofill') == null) { // skips filling in values
          FillForm(key,response.data.features[0].attributes[key]);
        }
      }
  }
   
// Main code execute (after page load due to domReady!)

    var urlParams = new URLSearchParams(window.location.search);
    
    require([
      "dojo/_base/lang",
      "esri/request",
      "dojo/domReady!"
    ], function(
      lang, esriRequest
    ) { 
      var url = restServiceUrl + "query?where=ID%3D"+urlParams.get("id")+"&outFields="+outFields+"&returnHiddenFields=false&returnGeometry=false&orderByFields=objectid&f=json";
      esriRequest(url,{
          responseType:'json',
          callbackParamName:'callback',
          timeout:8000
        }).then(lang.hitch(this,function(resp){
          if (resp.data.features.length > 0) {
            FastFacilityForm(resp);
          } else {
            document.getElementById("error").innerHTML = "Error: No record found matching id " + urlParams.get("id") + "."
          }
        }),lang.hitch(this,function(error){
          console.log(error.details);
          if (error.code==498) { // token error
            document.getElementById("error").innerHTML = "Security Error: Service requires login and none provided";
          } else {
            document.getElementById("error").innerHTML = "Failed error ("+error.details.code+"):"+error.details.messages+".";
          }
        }));
        
    }); // end dojo require
    