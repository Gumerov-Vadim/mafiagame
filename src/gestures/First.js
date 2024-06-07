// Import dependencies
import {Finger, FingerCurl, FingerDirection, GestureDescription} from 'fingerpose'; 

// Define Gesture Description
export const first = new GestureDescription('first'); 

// Index
first.addCurl(Finger.Index, FingerCurl.NoCurl, 0.95)
first.addDirection(Finger.Index, FingerDirection.VerticalUp, 0.95);

for(let finger of [Finger.Middle, Finger.Ring, Finger.Thumb, Finger.Pinky]){
    first.addCurl(finger, FingerCurl.Curl, 0.8);
    first.addCurl(finger, FingerCurl.FullCurl, 0.8); 
}