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
  // TEST ON GITHUB PAGEs

  document.getElementById("videoInput").removeAttribute("src");
  document.getElementById("videoInput").setAttribute("src", "media/1.mp4");
  document.getElementById("videoInput").setAttribute("src", "media/1.mp4");
  document.getElementById("videoInput").load();
  // document.getElementById("Embeded_Video").play();
}

function onOpenCvReady() {
  console.log('OpenCV Ready');
  document.getElementById('status').innerHTML = "OpenCV is Ready";
  document.getElementById('videoInputButton').disabled = false;
}

function setup() {
  // TODO initialize variables

  // put processVideo() here ?

  // setTimeout(processVideo, 0);
}

function weightUnitChanged(n) {
  let weight = document.getElementById('weight').value;
  let weightUnit;

  if(n == 1) {
    document.getElementById('lbs').disabled = true;
    document.getElementById('kg').disabled = false;
    weight = weight * 2.2;
    weight = weight.toFixed(2);
    document.getElementById('weight').value = weight;
  } else {
    document.getElementById('lbs').disabled = false;
    document.getElementById('kg').disabled = true;
    weight = weight / 2.2;
    weight = weight.toFixed(2);
    document.getElementById('weight').value = weight;
  }
}

function downloadVideo() {
  // TODO
  // convert canvas to webm and then convert to mp4
}

function barMath() {
  // TODO   (should I do this in a different function ???)
  // acceleration (m/s^2)
  // speed (concentric only? m/s)
  // power (kW)
  // horizontal displacement (cm)
  // current, average, min, max of each above


  // python
  // currentSpeed = (math.sqrt((((x1 - x0 * 110)) ** 2) + (((y1 - y0 * 120)) ** 2)))
  // inchesPerSecond = (currentSpeed * (1/FPS))
  // mph = inchesPerSecond/176
  // round(mph, 2)


  // velocity = 0;
  //
  // if (radius / height > 0.0125) {
  //   if(ref_radius == null) {
  //     ref_radius = radius;
  //     let mmpp = barbell_radius / ref_radius;
  //     console.log(mmpp);
  //   }
  //   x_disp = last_x - x;
  //   y_disp = last_y - y;
  //   y_distance = y_disp * mmpp;
  //   x_distance = x_disp * mmpp;
  //   distance = math.sqrt(x_disp ** 2 + y_disp ** 2) * mmpp;
  //   if(abs(y_distance) > barbell_radius / 4) {
  //     velocity = distance * vid_fps / 1000;
  //     y_velocity = y_distance * vid_fps / 1000;
  //
  //     if(y_velocity < 0.01 && y_velocity > -0.01) {
  //         y_velocity = 0;
  //     }
  //     // print("distance: {} mm, velocity: {:.2f} m/s, x_dist: {} mm, y_dist: {} mm, y_vel: {:.2f} m/s".format(int(distance), float(velocity), int(x_distance), int(y_distance), float(y_velocity)));
  //     history.append((int(x_distance), int(y_distance), y_velocity));
  //   }
  //
  // }

}

function changeInputSource() {
  // TODO switch between device camera and file input

  document.getElementById('deviceCameraButton').disabled = true;
}

function pathColorChange(color) {
  // TODO
  if(color == 'red') {
    // pathColor = new cv.Scalar(255, 0, 0);
    document.getElementById('redButton').disabled = true;deviceCameraButton
    document.getElementById('greenButton').disabled = false;
    document.getElementById('blueButton').disabled = false;
  } else if(color == 'green') {
    // pathColor = new cv.Scalar(0, 255, 0);
    document.getElementById('redButton').disabled = false;
    document.getElementById('greenButton').disabled = true;
    document.getElementById('blueButton').disabled = false;
  } else if(color == 'blue') {
    // pathColor = new cv.Scalar(0, 0, 255);
    document.getElementById('redButton').disabled = false;
    document.getElementById('greenButton').disabled = false;
    document.getElementById('blueButton').disabled = true;
  }
}

let count = 0;
let centerPointArray = new Array();
// var pathColor = new cv.Scalar(0, 255, 0);

function processVideo() {

  const videoInput = document.getElementById("videoInput");
  const canvas = document.getElementById("canvasOutput");
  const width = 432;
  const height = 768;
  const FPS = 30;
  let src = new cv.Mat(height, width, cv.CV_8UC4);
  let dst = new cv.Mat(height, width, cv.CV_8UC1);
  let cap = new cv.VideoCapture(videoInput);

  let begin = Date.now();
  cap.read(src);

  let hsv = new cv.Mat();
  cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB);
  cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);

  let greenLower = new cv.Scalar(50, 90, 130);
  let greenUpper = new cv.Scalar(64, 255, 255);

  // let greenLower = new cv.Scalar(33, 46, 80);
  // let greenUpper = new cv.Scalar(86, 156, 255);

  // let greenLower = new cv.Scalar(29, 86, 6);
  // let greenUpper = new cv.Scalar(143, 255, 86);

  let low = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), greenLower);
  let high = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), greenUpper);

  let mask = new cv.Mat();
  let mask1 = new cv.Mat();
  let mask2 = new cv.Mat();
  cv.inRange(hsv, low, high, mask1);
  cv.threshold(mask1, mask, 120, 255, cv.THRESH_BINARY);
  cv.bitwise_not(mask, mask2);

  let M = cv.Mat.ones(5, 5, cv.CV_8U);
  let anchor = new cv.Point(-1, -1);
  cv.erode(mask1, mask, M, anchor, 2, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
  cv.dilate(mask1, mask, M, anchor, 2, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());

  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  let cnts = contours.get(0);

  cv.findContours(mask, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);

  if(contours.size() == 0) {
    alert('Could not recognize tracking point.')
  }

  // for(let i = 0; i < contours.size(); i++) {
  //   cv.drawContours(src, contours, i, [0, 255, 0, 255], 2, cv.LINE_8, hierarchy, 100);
  // }

  let Moments;
  let M00;
  let M10;
  let M00Array = [0,];

  for(let j = 0; j < contours.size(); j++) {
    cnts = contours.get(j);
    Moments = cv.moments(cnts,false);
    M00Array[j] = Moments.m00;
  }

  Moments = cv.moments(cnts, false);
  M00 = Moments.m00;
  M10 = Moments.m10;
  M01 = Moments.m01;
  x_cm = M10/M00;
  y_cm = M01/M00;

  let centerPoint = new cv.Point(x_cm, y_cm);
  centerPointArray[count] = centerPoint;
  count++;
  cv.circle(src, centerPoint, 4, [0, 0, 255, 255], 2, cv.LINE_AA, 0);

  for(let k = 0; k < centerPointArray.length; k++) {
    // console.log(centerPointArray[k - 1])
    if(centerPointArray[k - 1] == null || centerPointArray[k] == null){
      continue;
    }
    cv.line(src, centerPointArray[k - 1], centerPointArray[k], [0, 255, 0, 255], 2); // pathColor [0, 255, 0, 255]
  }

  cv.imshow("canvasOutput", src);

  dst.delete();
  src.delete();
  mask.delete();
  mask1.delete();
  mask2.delete();
  low.delete();
  high.delete();
  contours.delete();
  hierarchy.delete();
  hsv.delete();

  let delay = 1000/FPS - (Date.now() - begin);
  setTimeout(processVideo, delay);
}

// setTimeout(processVideo, 0);
