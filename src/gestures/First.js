// Import dependencies
import {Finger, FingerCurl, FingerDirection, GestureDescription} from 'fingerpose'; 

// Define Gesture Description
export const first = new GestureDescription('first'); 

// Thumb 
first.addCurl(Finger.Thumb, FingerCurl.Curl, 1.0)

// Index
first.addCurl(Finger.Index, FingerCurl.NoCurl, 0.95)
first.addDirection(Finger.Index, FingerDirection.VerticalUp, 1.0);

// Pinky
first.addCurl(Finger.Pinky, FingerCurl.Curl, 1.0)
first.addDirection(Finger.Pinky, FingerDirection.VerticalUp, 1.0);

for(let finger of [Finger.Middle, Finger.Ring]){
    first.addCurl(finger, FingerCurl.FullCurl, 0.75); 
    first.addDirection(finger, FingerDirection.VerticalDown, 0.75);
}




