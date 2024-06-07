import React, { useRef, useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import * as handpose from "@tensorflow-models/handpose";
import Webcam from "react-webcam";
import { drawHand } from "../../utilities";
import * as fp from "fingerpose";
import Navbar from '../../components/Navbar';
import {loveYouGesture} from "../../gestures/LoveYou"; 
import {first} from "../../gestures/First"; 

export default function Guide() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [signName, setSignName] = useState("");
  const signNamesList = { thumbs_up: "Мирный", victory: "второй", i_love_you: "согласен",first:"первый" };

  useEffect(() => {
    const runHandpose = async () => {
      const net = await handpose.load();
      console.log("Handpose model loaded.");

      const detect = async () => {
        if (
          typeof webcamRef.current !== "undefined" &&
          webcamRef.current !== null &&
          webcamRef.current.video.readyState === 4
        ) {
          const video = webcamRef.current.video;
          const videoWidth = video.videoWidth;
          const videoHeight = video.videoHeight;

          webcamRef.current.video.width = videoWidth;
          webcamRef.current.video.height = videoHeight;
          canvasRef.current.width = videoWidth;
          canvasRef.current.height = videoHeight;

          const hand = await net.estimateHands(video);

          if (hand.length > 0) {
            const GE = new fp.GestureEstimator([
              first,
              fp.Gestures.VictoryGesture,
              // third,
              // forth,
              // fifth,
              fp.Gestures.ThumbsUpGesture,
              loveYouGesture,
              // sheriff,
              // mafia,
              // don,
              // check,
              // talk,
              // thinking,
            ]);
            const gesture = await GE.estimate(hand[0].landmarks, 4);
            if (gesture.gestures !== undefined && gesture.gestures.length > 0) {
              const bestGesture = gesture.gestures.reduce((prev, current) => (prev.score > current.score) ? prev : current);
              setSignName(bestGesture.name);
            }
          }

          const ctx = canvasRef.current.getContext("2d");
          drawHand(hand, ctx);
        }
      };

      const interval = setInterval(detect, 200);
      return () => clearInterval(interval);
    };

    runHandpose();
  }, []);

  return (
    <div className="App">
      <Navbar/>
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
      <div style={{
          position: "absolute",
          marginLeft: "auto",
          marginRight: "auto",
          left: 0,
          right: 0,
          textAlign: "center",
          zindex: 9,
          width: 640,
          height: 480,
          color: 'cyan',
          fontSize:'32px',
        }} className="sign-name">
        {signNamesList[signName]}
      </div>
      <div style={{
          position: "absolute",
          marginLeft: "auto",
          marginRight: "auto",
          left: 0,
          right: 0,
          bottom: '-250px',
          textAlign: "center",
          fontSize:'32px',
          zindex: 9,
          width: 640,
          height: 480
        }}
        >Попробуй показать жест. Я угадаю!</div>
    </div>
  );
}
