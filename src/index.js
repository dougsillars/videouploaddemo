import 'dotenv/config';
import express from 'express';
var favicon = require('serve-favicon');
const pug = require('pug');
//file system
var fs = require('fs');
//apivideo
const apiVideo = require('@api.video/nodejs-sdk');
//set up client
const client = new apiVideo.Client({ apiKey: process.env.APIVIDEO_Key });

const app = express();
const formidable = require('formidable')

app.use(favicon('public/icon.ico')); 
//app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine','pug');
app.use(express.static('public/'));







app.get('/', (req, res) => {
  return res.render('start');
});
app.post('/', (req,res) =>{
    
	var form = new formidable.IncomingForm();
	form.uploadDir = process.env.videoDir;
	form.parse(req, (err, fields, files) => {
    if (err) {
		console.error('Error', err);
		throw err;
    }
	
	
    console.log('Fields', fields);
    //console.log('Files', files.source);
	console.log('file size', files.source.size);
	console.log('file path', files.source.path);
	let mp4Support = false;
	if (fields.mp4 =="true"){
		mp4Support = true;	
	}
	let startUploadTimer = Date.now();
	let uploadCompleteTimer;
	let playReadyTimer;
	let result = client.videos.upload(files.source.path, {title: fields.title, description: fields.description, mp4Support: mp4Support});
	result.then(function(video) {
		uploadCompleteTimer = Date.now();
	   //delete file on node server
		fs.unlink(files.source.path, function (err) {
    	if (err) throw err;
    	// if no error, file has been deleted successfully
    	console.log('File deleted!');
		}); 
	  //get information from API.video	
	  console.log('video', video);
	  let videoId = video.videoId;
	  console.log('videoId', videoId);
	  console.log('player', video.assets.player);
	  let iframe = video.assets.iframe;
	  let player = video.assets.player;
	  //check video status until it is published
	  //when video is playable resturn the video page
	  videoStatus(video, function() {
	  	return res.render('video', {iframe, player});
	  }
      
	  );
	  
	  
	  
	}).catch(function(error) {
	  console.error(error);
	});
	console.log(result.response);

  // res.sendStatus(200);	
});
});

app.post('/upload', (req, res) => {
	
	
   // console.log('Got body:'+ req.body);
	//console.log("source:"+ req.body.source);
//	let result = client.videos.upload(req.body.source, {title: req.body.title, description: req.body.description, mp4Support: req.body.mp4});
/*	result.then(function(video) {
	  console.log(video.title);
	}).catch(function(error) {
	  console.error(error);
	});
	
*/	
 
  //upload the video
  //begin checking to see if video is completed
  //when uploaded load 3rd page with video?  or show on this page?
  
  
  
});


function videoStatus(video, callback) {
	//console.log(video);
	let videoId = video.videoId;
	let iframe  = video.assets.iframe;
	let playable = false;
	let status = client.videos.getStatus(videoId);
    status.then(function(videoStats){
    	console.log('status', status);
		playable = videoStats.encoding.playable;
		console.log('video playable?',videoStats.encoding.playable, playable);
		if (playable){
			//video is readyto be played
			console.log("ready to play the video");
			console.log(iframe);
			callback();			
		}else{
			//not ready
			console.log("not ready yet" );
			setTimeout(videoStatus(video, callback),2000);
		}
	}).catch(function(error) {
	  console.error(error);
	});;
	
	
}

app.listen(3000, () =>
  console.log('Example app listening on port 3000!'),
);


console.log('Hello Project.');
//console.log(client);
