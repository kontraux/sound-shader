var canvas = document.createElement('canvas');
canvas.id = 'glcanvas';
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.position = 'absolute';
document.body.appendChild(canvas)
var gl = canvas.getContext('webgl2');


function start() {
var context = new AudioContext();
var analyser = context.createAnalyser();
const numPoints = analyser.frequencyBinCount;
const audioDataArray = new Uint8Array(numPoints);

const tex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, tex);
gl.texImage2D(
    gl.TEXTURE_2D, 
    0,
    gl.LUMINANCE,
    numPoints,
    1,
    0,
    gl.LUMINANCE,
    gl.UNSIGNED_BYTE,
    null); 
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

var vertexShaderSource = `
attribute vec3 position;
void main() {
    gl_Position = vec4(position, 1.0);
}
`;
var fragmentShaderSource = `
precision mediump float;
uniform vec2 resolution;
uniform sampler2D audioData;

void main() {
    vec2 st = gl_FragCoord.xy/resolution;
    vec4 fft = texture2D(audioData, vec2(st.x * 0.25, 0.0));

    gl_FragColor = fft;
}
`;
var vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vertexShaderSource);
gl.compileShader(vertexShader);

var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, fragmentShaderSource);
gl.compileShader(fragmentShader);

var shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertexShader);
gl.attachShader(shaderProgram, fragmentShader);
gl.linkProgram(shaderProgram);
gl.useProgram(shaderProgram);

var positionAttributeLocation = gl.getAttribLocation(shaderProgram, 'position');

var positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
var positions = [
    -1.0, -1.0,
    -1.0, 1.0,
    1.0, -1.0,
    1.0, 1.0
];

gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
gl.enableVertexAttribArray(positionAttributeLocation);
gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

var resolution = gl.getUniformLocation(shaderProgram, 'resolution')

gl.uniform2fv(resolution, [screen.width / 8, screen.height / 8] )
function render(time) {

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    analyser.getByteFrequencyData(audioDataArray);

    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texSubImage2D(
        gl.TEXTURE_2D, 
        0,
        0,
        0,
        numPoints,
        1,
        gl.LUMINANCE,
        gl.UNSIGNED_BYTE,
        audioDataArray);
    requestAnimationFrame(render)
}
requestAnimationFrame(render)

var frag_compiled = gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS);
var vert_compiled = gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS);

var fragment_error = gl.getShaderInfoLog(fragmentShader);
var vertex_error = gl.getShaderInfoLog(vertexShader);
console.log(fragment_error);
console.log(vertex_error);

const audio = new Audio();
audio.loop = true;
audio.autoplay = true;

audio.addEventListener('play', handlePlay);
// add URL of sound source
audio.src = "";
audio.load();
audio.crossOrigin = "anonymous";

function handlePlay() {
    const source = context.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(context.destination);
}
window.removeEventListener('click', start)
}

window.addEventListener('click', start)
