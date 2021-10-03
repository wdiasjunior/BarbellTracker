(function localFileVideoPlayer() {
  'use strict'
  var playSelectedFile = function(event) {
    var file = this.files[0]
    var URL = window.URL || window.webkitURL
    var fileURL = URL.createObjectURL(file)
    var videoNode = document.querySelector('video')
    videoNode.src = fileURL
  }
  var inputNode = document.querySelector('input')
  inputNode.addEventListener('change', playSelectedFile, false)

  // document.getElementById('deviceCameraButton').disabled = false;

  // setTimeout(processVideo, 0); // ??? auto process video after is loaded?
  // delete all and reinitiale variables (matrixes, contours and lines)
})()

function loadSampleVideo() {
  document.getElementById("videoInput").removeAttribute("src");
  document.getElementById("videoInput").setAttribute("src", "media/3.mp4");
  // document.getElementById("videoInput").load();
  document.getElementById("videoInput").pause();
}

function onOpenCvReady() {
  console.log('OpenCV Ready');
  document.getElementById('status').innerHTML = "OpenCV is Ready";
  document.getElementById('videoInputButton').disabled = false;
}

let width, height;
function setSize() {
  // if (window.orientation == 0) {
    width = 432; height = 768; //portrait
  // }
  // else {
  //   width = 768; height = 432; //landscape
  // }
}
setSize();
const constraints = {
  video: { facingMode: "environment", }, audio: false
};
const video = document.getElementById("videoInput");
const canvas = document.getElementById('output');
const canvasPos = canvas.getBoundingClientRect();
canvas.width = width; canvas.height = height;
canvas.addEventListener('mousedown', down);
canvas.addEventListener('mouseup', up);
canvas.addEventListener('mousemove', move);
canvas.addEventListener('mouseleave', up);
canvas.addEventListener('touchstart', down);
canvas.addEventListener('touchend', up);
canvas.addEventListener('touchmove', move);

function successCallback(stream) {
  video.width = width; video.height = height;//prevent Opencv.js error.
  canvas.width = width; canvas.height = height;
  video.srcObject = stream;
  video.play();
  setTimeout(setupCV, 0);
  // streaming = !streaming;
}

let streaming = false;
function run() {
  const stream = video.srcObject;
  if(streaming == false) {
    video.width = width; video.height = height;//prevent Opencv.js error.
    canvas.width = width; canvas.height = height;
    video.srcObject = stream;
    video.play();
    setTimeout(setupCV, 0);
    document.getElementById('toggleStream').innerHTML = "Stop";
  } else {
    // const stream = video.srcObject;
    // const tracks = stream.getTracks();
    // tracks.forEach(track => {
    //   track.stop();
    // });
    video.pause();
    document.getElementById('toggleStream').innerHTML = "Play";
  }
  streaming = !streaming;
}

// function errorCallback(error) {
//   console.log(error);
// }
//
// let streaming = false;
function toggleStream() {
  if (streaming === false) {
    // navigator.getUserMedia(constraints, successCallback, errorCallback);
    successCallback();
    document.getElementById('toggleStream').innerHTML = "Stop";
  }
  else {
    // const stream = video.srcObject;
    // const tracks = stream.getTracks();
    // tracks.forEach(track => {
    //   track.stop();
    // });
    video.pause();
    document.getElementById('toggleStream').innerHTML = "Play";
  }
  streaming = !streaming;
}

let drawing = false;
let startX, startY, moveX, moveY;
function down(evt) {
    try {
        startX = Math.round(evt.touches[0].clientX - canvasPos.left);
        startY = Math.round(evt.touches[0].clientY - canvasPos.top);
    } catch{
        startX = Math.round(evt.clientX - canvasPos.left);
        startY = Math.round(evt.clientY - canvasPos.top);
    }
    moveX = startX; moveY = startY;
    drawing = true;
    tracking = false;
    inProcess = false;
}

let tracking = false;
function up(evt) {
    drawing = false;
    tracking = true;
}

function move(evt) {
    if (drawing == true) {
        try {
            moveX = Math.round(evt.touches[0].clientX - canvasPos.left);
            moveY = Math.round(evt.touches[0].clientY - canvasPos.top);
        } catch{
            moveX = Math.round(evt.clientX - canvasPos.left);
            moveY = Math.round(evt.clientY - canvasPos.top);
        }
    }
}

let frame, cap;
async function setupCV() {
    if (frame == undefined) {
        cap = await new cv.VideoCapture('videoInput');
        frame = await new cv.Mat(height, width, cv.CV_8UC4);
        console.log("cv setup complete.");
    }
    setTimeout(process, 0);
}

function process() {
    if (streaming === true) {
        cap.read(frame);
        if (drawing === true) {
            cv.rectangle(frame, new cv.Point(startX, startY), new cv.Point(moveX, moveY), new cv.Scalar(255, 0, 0, 255), 2);
        }
        if (tracking === true) {
            try {
                camShift();
            }
            catch {
                console.log("Error on camshift.");
                tracking = false;
            }
        }
        cv.imshow('output', frame);
        setTimeout(process, 33);
    }
}

let inProcess = false;
let trackWindow, roi, hsvRoi, mask, lowScalar, highScalar, low, high, roiHist, hsvRoiVec, termCrit, hsv, dst, hsvVec, trackBox;
function camShift() {
    if (inProcess === false) {
        console.log('Setup camshift.');
        inProcess = true;
        const p1 = Math.min(startX, moveX);
        const p2 = Math.min(startY, moveY);
        const p3 = Math.max(startX, moveX) - p1;
        const p4 = Math.max(startY, moveY) - p2;
        trackWindow = new cv.Rect(p1, p2, p3, p4);
        roi = frame.roi(trackWindow);
        hsvRoi = new cv.Mat();
        cv.cvtColor(roi, hsvRoi, cv.COLOR_RGBA2RGB);
        cv.cvtColor(hsvRoi, hsvRoi, cv.COLOR_RGB2HSV);
        mask = new cv.Mat();
        lowScalar = new cv.Scalar(30, 30, 0);
        highScalar = new cv.Scalar(180, 180, 180);
        low = new cv.Mat(hsvRoi.rows, hsvRoi.cols, hsvRoi.type(), lowScalar);
        high = new cv.Mat(hsvRoi.rows, hsvRoi.cols, hsvRoi.type(), highScalar);
        cv.inRange(hsvRoi, low, high, mask);
        roiHist = new cv.Mat();
        hsvRoiVec = new cv.MatVector();
        hsvRoiVec.push_back(hsvRoi);
        cv.calcHist(hsvRoiVec, [0], mask, roiHist, [180], [0, 180]);
        cv.normalize(roiHist, roiHist, 0, 255, cv.NORM_MINMAX);

        roi.delete(); hsvRoi.delete(); mask.delete(); low.delete(); high.delete(); hsvRoiVec.delete();
        termCrit = new cv.TermCriteria(cv.TERM_CRITERIA_EPS | cv.TERM_CRITERIA_COUNT, 10, 1);

        hsv = new cv.Mat(height, width, cv.CV_8UC3);
        dst = new cv.Mat();
        hsvVec = new cv.MatVector();
        hsvVec.push_back(hsv);
        trackBox = null;
    }

    cap.read(frame);
    cv.cvtColor(frame, hsv, cv.COLOR_RGBA2RGB);
    cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);
    cv.calcBackProject(hsvVec, [0], roiHist, dst, [0, 180], 1);

    [trackBox, trackWindow] = cv.CamShift(dst, trackWindow, termCrit);

    // Draw it on image
    let pts = cv.rotatedRectPoints(trackBox);
    cv.line(frame, pts[0], pts[1], [255, 0, 0, 255], 3);
    cv.line(frame, pts[1], pts[2], [255, 0, 0, 255], 3);
    cv.line(frame, pts[2], pts[3], [255, 0, 0, 255], 3);
    cv.line(frame, pts[3], pts[0], [255, 0, 0, 255], 3);
}
