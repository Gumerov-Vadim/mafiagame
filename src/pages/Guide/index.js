import React, { useRef, useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import * as handpose from "@tensorflow-models/handpose";

import Webcam from "react-webcam";
import { drawHand } from "../../utilities";

import {loveYouGesture} from "../../gestures/LoveYou"; 

///////// NEW STUFF IMPORTS
import * as fp from "fingerpose";
import victory from "../../images/victory.png";
import thumbs_up from "../../images/thumbs_up.png";
///////// NEW STUFF IMPORTS
import Navbar from '../../components/Navbar';
import matchers from "@testing-library/jest-dom/matchers";

export default function Guide() {const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  ///////// NEW STUFF ADDED STATE HOOK
  const [signName, setSignName] = useState("");
  const signNamesList = { thumbs_up: "Мирный", victory: "второй", i_love_you: "согласен" };
  ///////// NEW STUFF ADDED STATE HOOK

  const runHandpose = async () => {
    const net = await handpose.load();
    console.log("Handpose model loaded.");
    //  Loop and detect hands
    setInterval(() => {
      detect(net);
    }, 10);
  };

  const detect = async (net) => {
    // Check data is available
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      // Get Video Properties
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      // Set video width
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      // Set canvas height and width
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      // Make Detections
      const hand = await net.estimateHands(video);
      // console.log(hand);

      ///////// NEW STUFF ADDED GESTURE HANDLING

      if (hand.length > 0) {
        const GE = new fp.GestureEstimator([
          // first,
          // fp.Gestures.VictoryGesture,
          // third,
          // forth,
          // fifth,
          fp.Gestures.ThumbsUpGesture,
          // loveYouGesture,
          // sheriff,
          // mafia,
          // don,
          // check,
          // talk,
          // thinking,
        ]);
        const gesture = await GE.estimate(hand[0].landmarks, 4);
        if (gesture.gestures !== undefined && gesture.gestures.length > 0) {
          console.log(gesture.gestures);

          // const confidence = gesture.gestures.map(
          //   (prediction) => prediction.confidence
          // );
          // const maxConfidence = confidence.indexOf(
          //   Math.max.apply(null, confidence)
          // );
          let findMaxScoreName = (mas) =>{
            return mas.reduce((max,current)=>{
              return current.score > max.score?current:max;
            },{score:-Infinity}).name;
          };
          const test = findMaxScoreName(gesture.gestures);
          console.log(`test:${test}`);
          // console.log(gesture.gestures[maxConfidence].name);
          setSignName(test);
          console.log(signName);
        }
      }

      ///////// NEW STUFF ADDED GESTURE HANDLING

      // Draw mesh
      const ctx = canvasRef.current.getContext("2d");
      drawHand(hand, ctx);
    }
  };

  useEffect(()=>{runHandpose()},[]);

  return (
    <div className="App">
        <Webcam
          ref={webcamRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 9,
            width: 640,
            height: 480,
          }}
        />

        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 9,
            width: 640,
            height: 480,
          }}
        />
        {/* NEW STUFF */}
          <div
          className="sign-name"
            // style={{
            //   position: "absolute",
            //   marginLeft: "auto",
            //   marginRight: "auto",
            //   left: 400,
            //   bottom: 500,
            //   right: 0,
            //   textAlign: "center",
            //   height: 100,
            // }}
          >
            {signNamesList[signName]}
          </div>
        

        {/* NEW STUFF */}
    </div>
  );
}