//ctx.imageSmoothingEnabled = true;
//ctx.imageSmoothingQuality = 'high';
const sketches = [
    { time: 0, draw: (ctx) => drawCircle(ctx, 100, 100, 50) },
    { time: 2, draw: (ctx) => drawSquare(ctx, 200, 100, 50) },
    { time: 4, draw: (ctx) => drawTriangle(ctx, 300, 100, 50) }
];
function drawCircle(ctx, x, y, radius) {
    ctx.beginPath();
    ctx.stroke();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.stroke();
}
function drawSquare(ctx, x, y, size) {
    ctx.strokeRect(x, y, size, size);
}
function drawTriangle(ctx, x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + size / 2, y + size);
    ctx.lineTo(x - size / 2, y + size);
    ctx.closePath();
    ctx.stroke();
}
function animate() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get the current time of the audio
    const currentTime = audio.currentTime;

    // Draw sketches based on the current time
    sketches.forEach(sketch => {
        if (currentTime >= sketch.time) {
            sketch.draw(ctx);
        }
    });

    // Request the next animation frame
    requestAnimationFrame(animate);
}
audio.addEventListener('play', () => {
    requestAnimationFrame(animate);
});