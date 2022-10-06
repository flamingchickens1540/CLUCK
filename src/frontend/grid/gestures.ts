// USES MOSES LIBRARY: https://github.com/ifrost/moses
import { openFullscreen } from "../util";
import { redrawRows, refreshMemberListAndRerun } from ".";
declare const moses:any
// create collection of predefined patterns
const mosesPatterns = moses.model.MosesPatterns.create();

// choose patterns from the collection
// var patterns = [mosesPatterns.V, mosesPatterns.CIRCLE, mosesPatterns.DASH, mosesPatterns.SQUARE, mosesPatterns.SEVEN, mosesPatterns.Z];
const patterns = [mosesPatterns.CIRCLE, mosesPatterns.SQUARE, mosesPatterns.V, mosesPatterns.Z];

// create a sampler
const div = document.body;
const sampler = moses.sampler.DistanceSampler.create(div, 5);

// create a recogniser
export function registerGestures() {
   const recogniser = moses.recogniser.DefaultRecogniser.create();
   
   // register selected patterns
   patterns.forEach(function(pattern) {
      recogniser.register(pattern);
   });
   // display the result
   recogniser.on('recognised', async function(data) {
      window.gestureDetected = true;
      if(data.bestMatch.value > .4) {
         switch (data.bestMatch.pattern.name) {
            case mosesPatterns.CIRCLE.name:
               refreshMemberListAndRerun()
               break;
            case mosesPatterns.SQUARE.name:
               refreshMemberListAndRerun()
               break;
            case mosesPatterns.V.name:
               openFullscreen();
               redrawRows();
               break;
            case mosesPatterns.Z.name:
               if (!confirm("Are you sure you want to switch dashboards?")) {break;}
               window.location.assign(
                  window.location.pathname.includes('ofdeath') ? 
                  '../grid' :
                  './ofdeath'
               )
               break;
            
         }
         setTimeout(() => {window.gestureDetected = false}, 50)   
      } else {
         window.gestureDetected = false;
      }
   });
   
   // assign sampler to the recogniser
   recogniser.sampler = sampler;
   
   // activate the sampler
   sampler.activate();
}