// ==UserScript==
// @name         Export YouTube Subscriptions to RSS OPML
// @namespace    https://github.com/theborg3of5/Userscripts/
// @version      1.6
// @description  Adds the option to export subscriptions from YouTube as an OPML file of RSS feeds.
// @author       Gavin Borg
// @match        https://www.youtube.com/
// @grant        GM_registerMenuCommand
// @grant        GM.registerMenuCommand
// ==/UserScript==

function exportSubscriptions() {
   var channels = [];
   var inChannels = false;
   var channelURLFragment = "www.youtube.com/channel/";

   var links = document.querySelectorAll("div#items a#endpoint[href]"); // Sidebar links
   for(var i = 0; i < links.length; i++) {
      var href = links[i].href;
      var title = links[i].getAttribute("title");

         var channelId = getChannelId(href);
         if(channelId) {
            inChannels = true; // Found our first channel
         }

         if(inChannels) {
            if(!channelId) {
               break; // Once we're in the channels block, any link that's not to a channel means we've exited it and are finished.
            }

            channels.push({"title":title, "id":channelId});
         }
   }

   // Build download link and click it
   var xml = buildXML(channels);
   var fileType = "text/plain";
   var blob = new Blob([xml], {type: fileType});
   var blobURL = window.URL.createObjectURL(blob);
   var filename = "youtubeSubscriptions.opml";
   var downloadLink = document.createElement("a");
   downloadLink.setAttribute("href", blobURL);
   downloadLink.setAttribute("download", filename);
   downloadLink.dataset.downloadurl = fileType + ":" + filename + ":" + blobURL;
   downloadLink.click();
}

function getChannelId(url) {
   var channelURLFragment = "/channel/";

   // Not a channel URL
   if(url.indexOf(channelURLFragment) === -1) {
      return "";
   }
   if(url.indexOf("studio.youtube.com") > -1) { // "studio" URLs are typically the user's own videos (and not a subscription)
      return "";
   }

   var channelId = url.substring(url.lastIndexOf(channelURLFragment) + channelURLFragment.length, url.length);

   // Sometimes the link doesn't end with the ID, but with other stuff like "/videos" - trim that off.
   if(channelId.indexOf("/") > -1) {
      return channelId.substring(0, channelId.indexOf("/"))
   }

   return channelId;
}

function buildXML(channels) {
   // Goal structure:
   //  <opml version="1.0">
   //   <head>
   //   <title>YouTube Subscriptions as RSS</title>
   //   </head>
   //   <body>
   //   <outline text="YouTube Subscriptions" title="YouTube Subscriptions">
   //    <outline type="rss" text="" title="" xmlURL="" />
   //    ...
   //   </outline>
   //   </body>
   //  </opml>

   var xmlDoc = document.implementation.createDocument("", "", null);
   var opml = xmlDoc.createElement("opml");
   opml.setAttribute("version", "1.0");

   var head = xmlDoc.createElement("head");
   var title = xmlDoc.createElement("title");
   title.innerHTML = "YouTube Subscriptions as RSS";
   head.appendChild(title);
   opml.appendChild(head);

   var body = xmlDoc.createElement("body");
   var parentOutline = xmlDoc.createElement("outline");
   parentOutline.setAttribute("text", "YouTube Subscriptions")
   parentOutline.setAttribute("title", "YouTube Subscriptions")

   for(var j = 0; j < channels.length; j++) {
      var outline = xmlDoc.createElement("outline");
      outline.setAttribute("type", "rss");
      outline.setAttribute("text", channels[j].title);
      outline.setAttribute("title", channels[j].title);
      outline.setAttribute("xmlUrl", "https://www.youtube.com/feeds/videos.xml?channel_id=" + channels[j].id);
      parentOutline.appendChild(outline);
   }

   body.appendChild(parentOutline);

   opml.appendChild(body);
   xmlDoc.appendChild(opml);

   var s = new XMLSerializer();
   return s.serializeToString(xmlDoc);
}

// Support both Greasemonkey and others (Greasemonkey check must come first because it can't handle checking if GM_registerMenuCommand exists without crashing)
if(GM.registerMenuCommand) {
    GM.registerMenuCommand("Export YouTube Subscriptions to OPML", exportSubscriptions, "x");
}
else {
    GM_registerMenuCommand("Export YouTube Subscriptions to OPML", exportSubscriptions, "x");
}