// Import dependencies
import {Finger, FingerCurl, FingerDirection, GestureDescription} from 'fingerpose'; 

// Define Gesture Description
export const loveYouGesture = new GestureDescription('i_love_you'); 

// Thumb 
loveYouGesture.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0)

// Index
loveYouGesture.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0)
loveYouGesture.addDirection(Finger.Index, FingerDirection.VerticalUp, 1.0);

// Pinky
loveYouGesture.addCurl(Finger.Pinky, FingerCurl.NoCurl, 1.0)
loveYouGesture.addDirection(Finger.Pinky, FingerDirection.VerticalUp, 1.0);

for(let finger of [Finger.Middle, Finger.Ring]){
    loveYouGesture.addCurl(finger, FingerCurl.FullCurl, 0.75); 
    loveYouGesture.addDirection(finger, FingerDirection.VerticalDown, 0.75);
}




