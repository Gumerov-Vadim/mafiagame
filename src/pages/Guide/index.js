import React, { useEffect, useState, useRef } from 'react';
import { GestureRecognizer, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";
import Navbar from '../../components/Navbar';

export default function Guide() {
  const [gestureRecognizer, setGestureRecognizer] = useState(null);
  const [runningMode, setRunningMode] = useState("IMAGE");
  const [webcamRunning, setWebcamRunning] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const gestureOutputRef = useRef(null);
  const videoHeight = "360px";
  const videoWidth = "480px";

  useEffect(() => {
    const initializeGestureRecognizer = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        const recognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "GPU"
          },
          runningMode: runningMode
        });
        setGestureRecognizer(recognizer);
      } catch (error) {
        console.error("Failed to initialize gesture recognizer", error);
      }
    };

    initializeGestureRecognizer();
  }, [runningMode]);

  const handleImageClick = async (event) => {
    if (!gestureRecognizer) {
      alert("Please wait for gestureRecognizer to load");
      return;
    }

    if (runningMode === "VIDEO") {
      setRunningMode("IMAGE");
      await gestureRecognizer.setOptions({ runningMode: "IMAGE" });
    }

    const results = gestureRecognizer.recognize(event.target);

    console.log(results);

    if (results.gestures.length > 0) {
      const p = event.target.parentNode.childNodes[3];

      p.setAttribute("class", "info");

      const categoryName = results.gestures[0][0].categoryName;
      const categoryScore = parseFloat(results.gestures[0][0].score * 100).toFixed(2);
      const handedness = results.handednesses[0][0].displayName;

      p.innerText = `GestureRecognizer: ${categoryName}\n Confidence: ${categoryScore}%\n Handedness: ${handedness}`;
      p.style = `left: 0px; top: ${event.target.height}px; width: ${event.target.width - 10}px;`;

      const canvas = document.createElement("canvas");
      canvas.setAttribute("class", "canvas");
      canvas.setAttribute("width", event.target.naturalWidth + "px");
      canvas.setAttribute("height", event.target.naturalHeight + "px");
      canvas.style = `left: 0px; top: 0px; width: ${event.target.width}px; height: ${event.target.height}px;`;

      event.target.parentNode.appendChild(canvas);

      const canvasCtx = canvas.getContext("2d");
      const drawingUtils = new DrawingUtils(canvasCtx);

      for (const landmarks of results.landmarks) {
        drawingUtils.drawConnectors(
          landmarks,
          GestureRecognizer.HAND_CONNECTIONS,
          {
            color: "#00FF00",
            lineWidth: 5
          }
        );

        drawingUtils.drawLandmarks(landmarks, {
          color: "#FF0000",
          lineWidth: 1
        });
      }
    }
  };

  const enableWebcam = () => {
    if (!gestureRecognizer) {
      alert("Please wait for gestureRecognizer to load");
      return;
    }

    setWebcamRunning((prev) => !prev);
  };

  useEffect(() => {
    const video = videoRef.current;
    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext("2d");
    const gestureOutput = gestureOutputRef.current;

    const handleStream = (stream) => {
      video.srcObject = stream;
      video.addEventListener("loadeddata", predictWebcam);
    };

    const predictWebcam = async () => {
      if (runningMode === "IMAGE") {
        setRunningMode("VIDEO");
        await gestureRecognizer.setOptions({ runningMode: "VIDEO" });
      }

      let nowInMs = Date.now();

      if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        results = gestureRecognizer.recognizeForVideo(video, nowInMs);
      }

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      const drawingUtils = new DrawingUtils(canvasCtx);

      canvasElement.style.height = videoHeight;
      video.style.height = videoHeight;
      canvasElement.style.width = videoWidth;
      video.style.width = videoWidth;

      if (results.landmarks) {
        for (const landmarks of results.landmarks) {
          drawingUtils.drawConnectors(
            landmarks,
            GestureRecognizer.HAND_CONNECTIONS,
            {
              color: "#00FF00",
              lineWidth: 5
            }
          );

          drawingUtils.drawLandmarks(landmarks, {
            color: "#FF0000",
            lineWidth: 2
          });
        }
      }

      canvasCtx.restore();

      if (results.gestures.length > 0) {
        gestureOutput.style.display = "block";
        gestureOutput.style.width = videoWidth;

        const categoryName = results.gestures[0][0].categoryName;
        const categoryScore = parseFloat(results.gestures[0][0].score * 100).toFixed(2);
        const handedness = results.handednesses[0][0].displayName;

        gestureOutput.innerText = `GestureRecognizer: ${categoryName}\n Confidence: ${categoryScore} %\n Handedness: ${handedness}`;
      } else {
        gestureOutput.style.display = "none";
      }

      if (webcamRunning) {
        window.requestAnimationFrame(predictWebcam);
      }
    };

    let lastVideoTime = -1;
    let results = undefined;

    const constraints = {
      video: true
    };

    if (webcamRunning) {
      navigator.mediaDevices.getUserMedia(constraints)
        .then(handleStream)
        .catch((error) => {
          console.error("Error accessing webcam:", error);
          alert("Failed to access webcam. Please make sure your webcam is connected and accessible.");
        });
    }

    return () => {
      video.removeEventListener("loadeddata", predictWebcam);
    };
  }, [gestureRecognizer, runningMode, webcamRunning]);

  return (
    <div>
    <Navbar/>
      <h1>Recognize hand gestures using the MediaPipe HandGestureRecognizer task</h1>

      <section id="demos" className={!gestureRecognizer ? "invisible" : ""}>
        <h2>Demo: Recognize gestures</h2>
        <p><em>Click on an image below</em> to identify the gestures in the image.</p>

        <div className="detectOnClick" onClick={handleImageClick}>
          <p className="classification removed"></p>
        </div>
        <div className="detectOnClick" onClick={handleImageClick}>
          <p className="classification removed"></p>
        </div>

        <h2><br/>Demo: Webcam continuous hand gesture detection</h2>
        <p>Use your hand to make gestures in front of the camera to get gesture classification. <br/>Click <b>enable webcam</b> below and grant access to the webcam if prompted.</p>

        <div id="liveView" className="videoView">
          <button id="webcamButton" className="mdc-button mdc-button--raised" onClick={enableWebcam}>
            <span className="mdc-button__ripple"></span>
            <span className="mdc-button__label">{webcamRunning ? "DISABLE WEBCAM" : "ENABLE WEBCAM"}</span>
          </button>
          <div style={{position: 'relative'}}>
            <video ref={videoRef} id="webcam" autoPlay playsInline></video>
            <canvas ref={canvasRef} className="output_canvas" id="output_canvas" width="1280" height="720" style={{position: 'absolute', left: '0px', top: '0px'}}></canvas>
            <p ref={gestureOutputRef} id='gesture_output' className="output"></p>
          </div>
        </div>
      </section>
    </div>
  );
}
