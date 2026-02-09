// Wait for the DOM to fully load
document.addEventListener('DOMContentLoaded', () => {

    const btn1 = document.getElementById('btnProject1');
    const btn2 = document.getElementById('btnProject2');
    const btn3 = document.getElementById('btnProject3');
    // Redirect to project1 folder
    btn1.addEventListener('click', () => {
        window.open ('traffic-light-map/index.html', '_blank');
    });

    // Redirect to project2 folder
    btn2.addEventListener('click', () => {
        window.open ('street-light-map/index.html', '_blank');
    });

    // Redirect to project3 folder
    btn3.addEventListener('click', () => {
        window.open ('solar-led-map/index.html', '_blank');
    });
});