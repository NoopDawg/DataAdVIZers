let bargraph, bargraph2;

function playAnimation() {
    // Your animation code here
    console.log('Playing animation for the first time.');

    // Get all elements with the class 'fade-in'
    const elements = document.querySelectorAll('.fade-in');
    
    function fadeInWithDelay(element, delay) {
        setTimeout(() => {
            element.style.transition = 'opacity 1s ease-in-out';
            element.style.opacity = 1;
        }, delay);
    }

    fadeInWithDelay(elements[0], 3000);
    fadeInWithDelay(elements[1], 6000);
    fadeInWithDelay(elements[2], 9000);
    fadeInWithDelay(elements[3], 12000);
    fadeInWithDelay(elements[4], 17000);
    fadeInWithDelay(elements[5], 20000);
    fadeInWithDelay(elements[6], 23000);

    function createGraph1(){
        bargraph = new SimpleBarGraph("#block2-graph");
    }

    function createGraph2(){
        bargraph2 = new SimpleBarGraph("#block4-graph");
    }

    setTimeout(createGraph1, 12000);
    setTimeout(createGraph2, 23000);
    setTimeout(nextPageBtn, 28000);
  
    // Set a flag in localStorage to indicate that the animation has played
    localStorage.setItem('hasAnimationPlayed', true);
}

function nextPageBtn(){
    const button = document.querySelector(".button");
    button.innerHTML = "Explore GenZ's housing market history  <img src=\"css/arrow-right-solid.svg\" alt=\"Right Arrow\">";
}

// Check if the animation has played before
const hasAnimationPlayed = localStorage.getItem('hasAnimationPlayed');

// only play animation first time they visit page, the if true is for testing
if (!hasAnimationPlayed) {
// if (true) {
    playAnimation();
} else {
    console.log('Animation has played before.');
    const elements = document.querySelectorAll('.fade-in');
    elements.forEach(function(element, index) {
        element.style.opacity = 1;
    });
    bargraph = new SimpleBarGraph("#block2-graph");
    bargraph2 = new SimpleBarGraph("#block4-graph");
    nextPageBtn();
}
  

  