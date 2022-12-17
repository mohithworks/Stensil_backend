//import express from 'express';

var { createClient } = require("@supabase/supabase-js");
var { decode } = require("base64-arraybuffer");
var { google } = require("googleapis");
var fs = require("fs");
var mammoth = require("mammoth");
var express = require("express");
var cors = require("cors");
var axios = require('axios');
require("dotenv").config();

// Create a single supabase client for interacting with your database
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());

app.get("/", function (req, res, next) {
  res.send("Started");
});

app.get("/api", async function (req, res, next) {
  var fileId = req.query.fileId,
    accessToken = req.query.accessToken,
    authId = req.query.authid;

  // oauth setup
  var OAuth2 = google.auth.OAuth2,
    OAuth2Client = new OAuth2();

  // set oauth credentials
  OAuth2Client.setCredentials({ access_token: accessToken });

  // google drive setup
  var drive = google.drive({ version: "v3", auth: OAuth2Client });

  var i = 0;

  const url = "";

  console.log("Started");

  var options = {
    styleMap: ["p[style-name='Heading 1'] => h3:fresh"],
    convertImage: mammoth.images.imgElement(function (image) {
      i++;
      const contentType = image.contentType;
      return image.read("base64").then(async function (imageBuffer) {
        const imgext = contentType.replace("image/", "");
        var titletest = req.query.title;
        const imagepath =
          "public/" + authId + "/" + titletest + "/" + i + "." + imgext;
        const { data, error } = await supabase.storage
          .from("posts")
          .upload(imagepath, decode(imageBuffer), {
            contentType: contentType,
            upsert: true,
          });
        if (error) {
          console.log(error);
        }
        if (data) {
          const { publicURL } = await supabase.storage
            .from("posts")
            .getPublicUrl(imagepath);
          if (error) {
            console.log(error);
          }
          if (publicURL) {
            console.log(publicURL);
            const mainurl = publicURL + "?" + new Date().getTime();
            return {
              src: mainurl.toString(),
              alt: "Test",
            };
          }
          // if(publicURL) {
          //     url = publicURL;
          //     console.log(publicURL);

          // }
        }
        //const url = uploadImg(i, imageBuffer, contentType);
        //url.then(function(url) {

        //});
      });
    }),
  };
  // download file as text/html
  var buffers = [];
  console.log("Started 2");
  try {
    const result = await drive.files.export(
      {
        fileId: fileId,
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
      { responseType: "arraybuffer" }
    );
    console.log(result.status);
    buffers.push(Buffer.from(result.data));
    console.log(buffers);
    var buffer = Buffer.concat(buffers);
    var html;
    mammoth
      .convertToHtml({ buffer: buffer }, options)
      .then(function (result) {
        html = result.value; // The generated HTMLx
        var messages = result.messages; // Any messages, such as warnings during conversion
        console.log(messages);
        var editedHtml = html.replace(/<img /g, "<img ");
        if (editedHtml) {
          res.send(editedHtml);
        }
        // fs.writeFile('binary2.html', editedHtml, function(err){
        //     if(err)
        //     {
        //         console.log(err);

        //     }
        //     else
        //     {
        //     console.log("Success");
        //     }
        // });
      })
      .done();
  } catch (err) {
    console.log(err);
  }
});

app.get("/api/cus-domain", async function (req, res, next) {
  var incomingDomain = req.query.incomingDomain,
    targetDomain = req.query.targetDomain,
    ssl = req.query.ssl;

  var data = JSON.stringify({
    "redirect": false,
    "incoming_address": incomingDomain,
    "exact_match": false,
    "target_address": targetDomain,
    "target_ports": ssl
  });
  
  var config = {
    method: 'post',
    url: 'https://cloud.approximated.app/api/vhosts',
    headers: { 
      'api-key': 'ca394897-f4c7-45c0-987f-73b8c69876e1-1670608243', 
      'Content-Type': 'application/json'
    },
    data : data
  };
  
  axios(config)
  .then(function (response) {
    console.log(JSON.stringify(response.data));
    res.send(response.data);
  })
  .catch(function (error) {
    console.log(error);
  });

});

app.get("/api/cus-domain/check", async function (req, res, next) {
  var incomingDomain = req.query.incomingDomain;

  var data = JSON.stringify({
    "incoming_address": incomingDomain
  });
  
  var config = {
    method: 'post',
    url: 'https://cloud.approximated.app/api/vhosts/by/incoming',
    headers: { 
      'api-key': 'ca394897-f4c7-45c0-987f-73b8c69876e1-1670608243', 
      'Content-Type': 'application/json'
    },
    data : data
  };
  
  axios(config)
  .then(function (response) {
    console.log(JSON.stringify(response.data));
    res.send(response.data);
  })
  .catch(function (error) {
    console.log(error);
  });

});

app.listen(port, () => console.log(`server started on port ${port}`));

// export default app;
