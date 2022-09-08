// USES MOSES LIBRARY: https://github.com/ifrost/moses

// create collection of predefined patterns
var mosesPatterns = moses.model.MosesPatterns.create();
 
// choose patterns from the collection
// var patterns = [mosesPatterns.V, mosesPatterns.CIRCLE, mosesPatterns.DASH, mosesPatterns.SQUARE, mosesPatterns.SEVEN, mosesPatterns.Z];
var patterns = [mosesPatterns.CIRCLE, mosesPatterns.SQUARE];
 
// create a sampler
var div = document.body;
var sampler = moses.sampler.DistanceSampler.create(div, 5);

// create a recogniser
var recogniser = moses.recogniser.DefaultRecogniser.create();

// register selected patterns
patterns.forEach(function(pattern) {
   recogniser.register(pattern);
});

// display the result
recogniser.on('recognised', async function(data) {
   if(data.bestMatch.value > .4) {
    await refreshMembres()
    location.reload()
   }
});

// assign sampler to the recogniser
recogniser.sampler = sampler;

// activate the sampler
sampler.activate();