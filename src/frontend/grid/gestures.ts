// USES MOSES LIBRARY: https://github.com/ifrost/moses
import { refreshMemberList } from "./clockapi";
import moses from "./moses"
import { openFullscreen } from "../util";
import { redrawRows } from ".";
// create collection of predefined patterns
const mosesPatterns = moses.model.MosesPatterns.create();

// choose patterns from the collection
// var patterns = [mosesPatterns.V, mosesPatterns.CIRCLE, mosesPatterns.DASH, mosesPatterns.SQUARE, mosesPatterns.SEVEN, mosesPatterns.Z];
const patterns = [mosesPatterns.CIRCLE, mosesPatterns.SQUARE, mosesPatterns.V];

// create a sampler
const div = document.body;
const sampler = moses.sampler.DistanceSampler.create(div, 5);

// create a recogniser
export function register() {
   const recogniser = moses.recogniser.DefaultRecogniser.create();
   
   // register selected patterns
   patterns.forEach(function(pattern) {
      recogniser.register(pattern);
   });
   // display the result
   recogniser.on('recognised', async function(data) {
      
      if(data.bestMatch.value > .4) {
         switch (data.bestMatch.pattern.name) {
            case mosesPatterns.CIRCLE.name:
            await refreshMemberList();
            break;
            case mosesPatterns.SQUARE.name:
            await refreshMemberList();
            break;
            case mosesPatterns.V.name:
            openFullscreen();
            redrawRows();
            break;
         }
         
      }
   });
   
   // assign sampler to the recogniser
   recogniser.sampler = sampler;
   
   // activate the sampler
   sampler.activate();
}