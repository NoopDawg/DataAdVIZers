let bargraph;

document.addEventListener('DOMContentLoaded', function() {
    // Get all elements with the class 'fade-in'
    var elements = document.querySelectorAll('.fade-in-text');

    // Function to add fade-in class after a delay
    function fadeInElements() {
        elements.forEach(function(element, index) {
            requestAnimationFrame(function() {
                element.style.opacity = 1;
            });
            index += 0; // Adjust the delay as needed
            element.style.transitionDelay = index * 4000 + 'ms';
        });
    }

    // Call the function after a delay or on a trigger (e.g., button click)
    setTimeout(fadeInElements, 500);
    setTimeout(showGraph, 20500);
});

function showGraph() {
    const nav_btn = document.querySelector('.page-nav ');
    const newDiv = document.querySelector('#bar-graph');

    bargraph = new SimpleBarGraph("#bar-graph");

    requestAnimationFrame(function () {
        // Set opacity to 1 to trigger the fade-in effect
        newDiv.style.opacity = 1;
        nav_btn.style.opacity = 1;
    });
}