var dojoConfig = {
  parseOnLoad: true
};
"use strict";    
  
var restServiceUrl = 'https://services9.arcgis.com/kO1m83jGh0X2wqlg/ArcGIS/rest/services/service_9fcfe2f417b54da4a089217a02166c82/FeatureServer/0/';
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

  function ShowMap(response){
    require([
      "esri/Map",
      "esri/views/MapView",
      "esri/widgets/BasemapToggle",
      "esri/widgets/Zoom",
      "esri/Graphic",
      "esri/layers/GraphicsLayer",
      "dojo/domReady!"
      ], function(Map, MapView, BasemapToggle, Zoom, Graphic, GraphicsLayer) {
      // Create the Map with an initial basemap
      
      var map = new Map({
        basemap: "topo"
      });

      // Create the MapView and reference the Map in the instance
      var view = new MapView({
        container: "viewMapDiv",
        
        map: map,
        center: [response.data.features[0].geometry.x, response.data.features[0].geometry.y],
        zoom: 15
      });

      // 1 - Create the widget
      var toggle = new BasemapToggle({
        // 2 - Set properties
        view: view, // view that provides access to the map's 'topo' basemap
        nextBasemap: "hybrid" // allows for toggling to the 'hybrid' basemap
      });
      

      // Add widget to the top right corner of the view
      view.ui.components = [];
      var zoom = new Zoom({
        view: view
      });
      view.ui.add(toggle, "top-right");
      view.ui.add(zoom, "top-left");

      var graphicsLayer = new GraphicsLayer();
      map.add(graphicsLayer);

      // Add a blue location pin
      var pictureGraphic = new Graphic({
        geometry: {
          type: "point",
          longitude: response.data.features[0].geometry.x,
          latitude: response.data.features[0].geometry.y
        },
        symbol: {
          type: "picture-marker",
          url: "https://developers.arcgis.com/labs/images/bluepin.png",
          width: "14px",
          height: "26px"
        }
      });

      graphicsLayer.add(pictureGraphic);

     // Add text below the pin
     var textGraphic = new Graphic({
       geometry: {
         type: "point",
         longitude: response.data.features[0].geometry.x,
         latitude: response.data.features[0].geometry.y
       },
       symbol: {
          type: "text",
          color: [25,25,25],
          haloColor: [255,255,255],
          haloSize: "2px",
          text: response.data.features[0].attributes['listingtitle'],
          xoffset: 0,
          yoffset: -25,
          font: {
            size: 14
         }
       }
     });
     graphicsLayer.add(textGraphic);
    });
   
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
      var url = restServiceUrl + "query?where=globalid%3D'"+urlParams.get("id")+"'&outFields="+outFields+"&returnHiddenFields=false&returnGeometry=true&orderByFields=objectid&f=json";
      console.log(url);
      esriRequest(url,{
          responseType:'json',
          callbackParamName:'callback',
          timeout:8000
        }).then(lang.hitch(this,function(resp){
          if (resp.data.features.length > 0) {
            FastFacilityForm(resp);
            ShowMap(resp);
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
    