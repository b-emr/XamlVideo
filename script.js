const audio = document.getElementById('audio');
const canvas = document.getElementById('canvas');
const content = document.getElementById('content');
const questionImage = document.getElementById('question');
const ctx = canvas.getContext('2d');
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


var pdf_url = 'https://cozum.dijitalokul.com/uploads/assets/questions/12189/ddb1d75c50a026b522d6a0ad291c6aec.pdf';
var swf_url = 'https://cozum.dijitalokul.com/uploads/assets/questions/12189/ddb1d75c50a026b522d6a0ad291c6aec.swf';
var xaml_url = 'https://cozum.dijitalokul.com/uploads/assets/solution/cozum_15404_09_26_2019_10_02_05.xaml';

var swfWidth = 0;
var swfHeight = 0;

var image_x;
var image_y;
var margin_x;
var margin_y;
var infoScale;

async function getQuestionToCanvas(pdfUrl) {
    const requestUrl = 'https://cozum.dijitalokul.com/soru_cozum/web_player/pdf2jpg.php';
    const params = new URLSearchParams({
        action: 'pdf2jpg',
        url: pdfUrl,
        x: 1,
        y: 1
    });

    try {
        const response = await fetch(`${requestUrl}?${params}`, {
            method: 'GET',
            referrerPolicy: 'strict-origin-when-cross-origin'
        });

        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }

        questionImage.src = await response.text();
    }
    catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}

async function getImageSize(swfUrl){
    const requestUrl = 'https://cozum.dijitalokul.com/soru_cozum/web_player/get-size.php';
    const params = new URLSearchParams({
        action: 'get-size',
        url: swfUrl
    });

    try{
        const response = await fetch(`${requestUrl}?${params}`, {
            method: 'GET',
            referrerPolicy: 'strict-origin-when-cross-origin'
        });
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }

        const sizes = await response.json();
        window.swfWidth = sizes["0"];
        window.swfHeight = sizes["1"];
    }
    catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}

async function decodeXAML(xamlUrl){

    function base64ToString(_xmlString, _keyString) {

        var _strings = _xmlString.split("");

        var _keys = _keyString.split("|");
        _strings.splice(_keys[0], 1);
        _strings.splice(_keys[1], 1);
        return decode64(_strings.join(""));
    }

    function decode64(input) {

        var keyStr = "ABCDEFGHIJKLMNOP" +
            "QRSTUVWXYZabcdef" +
            "ghijklmnopqrstuv" +
            "wxyz0123456789+/" +
            "=";
        var output = "";
        var chr1, chr2, chr3 = "";
        var enc1, enc2, enc3, enc4 = "";
        var i = 0;

        // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
        var base64test = /[^A-Za-z0-9\+\/\=]/g;
        if (base64test.exec(input)) {
            alert("There were invalid base64 characters in the input text.\n" +
                "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
                "Expect errors in decoding.");
        }
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        do {
            enc1 = keyStr.indexOf(input.charAt(i++));
            enc2 = keyStr.indexOf(input.charAt(i++));
            enc3 = keyStr.indexOf(input.charAt(i++));
            enc4 = keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }

            chr1 = chr2 = chr3 = "";
            enc1 = enc2 = enc3 = enc4 = "";

        } while (i < input.length);

        return decodeURI(output);
    }

    var xamlText;

    const requestUrl = 'https://cozum.dijitalokul.com/soru_cozum/web_player/xaml2text.php';
    const params = new URLSearchParams({
        action: 'get-xml',
        url: xamlUrl
    });

    try {
        const response = await fetch(`${requestUrl}?${params}`, {
            method: 'GET',
            referrerPolicy: 'strict-origin-when-cross-origin'
        });
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }

        xamlText = await response.text();
    }
    catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }

    var _cryptKey = "10|20";
    var decrypted = base64ToString(xamlText, _cryptKey);

    return decrypted;
}

function getSizes(xamlFile) {
    const pattern = /<info[^>]*>([^<]+)<\/info>/i;

    const regex = new RegExp(pattern);

    const match = regex.exec(xamlFile);

    if (match) {

        const result = match[1];
        const _info = result.split('|');

        const frameWidth = parseInt(_info[0], 10);
        const frameHeight = parseInt(_info[1], 10);
        const marginTop = parseInt(_info[3], 10);
        const marginLeft = parseInt(_info[4], 10);

        console.log('Frame Width:', frameWidth);
        console.log('Frame Height:', frameHeight);
        console.log('Margin Top:', marginTop);
        console.log('Margin Left:', marginLeft);


        var infoWindowW = _info[0];
        var infoWindowH = _info[1];

        var playerScale = Math.min((window.screen.width / infoWindowW), (window.screen.height / infoWindowH));

        console.log("window screen w:", window.screen.width);
        console.log("window screen h:", window.screen.height);
        console.log('player Scale:',playerScale);

        var topMargin = _info[3];
        var leftMargin = _info[4];
        var canvasWidth = infoWindowW * playerScale;
        var canvasHeight = infoWindowH * playerScale;

        questionImage.width = swfWidth*2.5;
        questionImage.height = swfHeight*2.5;

        questionImage.topmargin = topMargin;
        questionImage.leftmargin = leftMargin;

        ctx.drawImage(questionImage);
    }
}

xamlString = await decodeXAML(xaml_url);
await getImageSize(swf_url);
await getQuestionToCanvas(pdf_url);
getSizes(xamlString);