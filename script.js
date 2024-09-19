const audio = document.getElementById('audio');
const canvas = document.getElementById('canvas');
const content = document.getElementById('content');
const media = document.getElementById('media');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';

class DrawingObject {

    points;
    t1;
    t2;
    color;

    constructor(points, t1, t2, color) {
        this.points = points;
        this.t1 = t1;
        this.t2 = t2;
        this.color = color;
    }
}
class Point {
    x;
    y;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
let objects = [];

let pdf_url = 'https://cozum.dijitalokul.com/uploads/assets/questions/12189/ddb1d75c50a026b522d6a0ad291c6aec.pdf';
let swf_url = 'https://cozum.dijitalokul.com/uploads/assets/questions/12189/ddb1d75c50a026b522d6a0ad291c6aec.swf';
let xaml_url = 'https://cozum.dijitalokul.com/uploads/assets/solution/cozum_15404_09_26_2019_10_02_05.xaml';

let imageSrc ='';
let xamlString='';
let swfWidth = 0;
let swfHeight = 0;

let xamlInfo;
let scale;


//Initialization Parts
async function getImageSrc(pdfUrl) {
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

        imageSrc = await response.text();
    }
    catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}

async function decodeXAML(xamlUrl){

    function base64ToString(_xmlString, _keyString) {

        let _strings = _xmlString.split("");

        let _keys = _keyString.split("|");
        _strings.splice(_keys[0], 1);
        _strings.splice(_keys[1], 1);
        return decode64(_strings.join(""));
    }

    function decode64(input) {

        let keyStr = "ABCDEFGHIJKLMNOP" +
            "QRSTUVWXYZabcdef" +
            "ghijklmnopqrstuv" +
            "wxyz0123456789+/" +
            "=";
        let output = "";
        let chr1, chr2, chr3 = "";
        let enc1, enc2, enc3, enc4 = "";
        let i = 0;

        // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
        let base64test = /[^A-Za-z0-9\+\/\=]/g;
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

    let xamlText;

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

    let _cryptKey = "10|20";
    xamlString = base64ToString(xamlText, _cryptKey);
}

async function getSwfInfo(swfUrl){
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
        swfWidth = sizes["0"];
        swfHeight = sizes["1"];
    }
    catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}

function getXamlInfo(xamlFile) {
    const pattern = /<info[^>]*>([^<]+)<\/info>/i;

    const regex = new RegExp(pattern);

    const match = regex.exec(xamlFile);

    if (match) {

        const result = match[1];
        xamlInfo = result.split('|');
    }
}

function resizeCanvas (){

    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;

    let infoWindowW = xamlInfo[0];
    let infoWindowH = xamlInfo[1];
    let playerScale = Math.min((viewportWidth / infoWindowW), ((viewportHeight-100) / infoWindowH));
    let infoScale = xamlInfo[2];

    let imagePaddingX = xamlInfo[3] * playerScale;
    let imagePaddingY = xamlInfo[4] * playerScale;

    let canvasWidth = infoWindowW * playerScale;
    let canvasHeight = infoWindowH * playerScale;

    let canvasMarginX = (viewportWidth-canvasWidth)/2;
    let canvasMarginY = (viewportHeight-canvasHeight)/2;

    let imageWidth = (swfWidth * infoScale) * playerScale;
    let imageHeight = (swfHeight * infoScale) * playerScale

    scale = playerScale;

    $("#canvas").css({
        "background-image": "url('" + imageSrc + "')",
        "background-position": imagePaddingX + "px " + imagePaddingY + "px",
        "background-size": imageWidth + "px" + " " + imageHeight + "px",
        "width": canvasWidth,
        "height": canvasHeight,
        'margin-left': canvasMarginX,
        'margin-right': canvasMarginX
    });

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    $("#content").css('height', canvasHeight);
    $("#content").css('margin-top', ($(window).height() - $('#player').height()-canvasHeight) / 2);
}

function getObjects(xamlString) {

    function extractAttributeValue(element, attributeName, defaultValue) {
        const pattern = new RegExp(`${attributeName}="(.*?)"`);
        let match = element.match(pattern);
        return match ? match[1] : defaultValue;
    }

    const objPattern = /<obj[^>]*>([\s\S]*?)<\/obj>/g;
    const poPattern = /<po>(.*?)<\/po>/g;

    let objMatches = [...xamlString.matchAll(objPattern)];
    objects = [];
    objMatches.forEach(objMatch => {

        let poMatches = [...objMatch[1].matchAll(poPattern)];

        const points = poMatches.map(poMatch => poMatch[1]);

        let t1 = parseFloat(extractAttributeValue(objMatch[0], "t1", "0"));
        let t2 = parseFloat(extractAttributeValue(objMatch[0], "t2", "0"));
        let colorValue = extractAttributeValue(objMatch[0], "color", "12597547");
        let colorInt = parseInt(colorValue, 10);
        let lineColor = {
            r: (colorInt >> 16) & 0xFF,
            g: (colorInt >> 8) & 0xFF,
            b: colorInt & 0xFF
        };

        const pointlist = points.map(x => x.split("|"));
        pointlist.map(x => x[0] = x[0] * scale);
        pointlist.map(y => y[1] = y[1] * scale);
        let pointler = [];
        pointlist.forEach(point => pointler.push(new Point(point[0],point[1])));
        objects.push(new DrawingObject(pointler,t1/1000,t2/1000,lineColor));
    });
}


//Canvas Parts:
function updateCanvas() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < objects.length; i++) {

        let object = objects[i];
        let delay = object.t2/object.points.length;
        let color = `rgb(${object.color.r}, ${object.color.g}, ${object.color.b})`;

        ctx.beginPath();

        for (let j = 0; j < object.points.length; j++) {

            if(audio.currentTime >= (object.t1+delay*j-0.001)) {
                if(j === 0) {
                    ctx.moveTo(object.points[j].x, object.points[j].y);
                }
                else {
                    ctx.lineTo(object.points[j].x, object.points[j].y);
                }
            }
        }


        ctx.strokeStyle = color; // Set the line color
        ctx.lineWidth = 2.5;        // Set the line width
        ctx.stroke();
    }
}

const updateInterval = 10;
let intervalId;


async function Initialize(){
    await decodeXAML(xaml_url);
    await getSwfInfo(swf_url);
    await getImageSrc(pdf_url);
    getXamlInfo(xamlString);
    resizeCanvas();
    getObjects(xamlString);
}

await Initialize();

window.addEventListener('resize', function(){
    resizeCanvas();
    updateCanvas();
});

audio.addEventListener('timeupdate', updateCanvas);

audio.addEventListener('play', () => {
    intervalId = setInterval(updateCanvas, updateInterval);
});

audio.addEventListener('pause', () => {
    clearInterval(intervalId);
});

audio.addEventListener('seeked', () => {
    updateCanvas();
});


/*
function pdf2jpg(pdfUrl) {
    pdfjsLib.getDocument(pdfUrl).promise.then(pdf => {
        pdf.getPage(1).then(page => {
            const viewport = page.getViewport({ scale: 1 });
            const renderContext = {
                canvasContext: ctx,
                viewport: viewport,
                width:
            };
            page.render(renderContext).promise.then(() => {
                console.log('PDF page rendered');
            });
        });
    });
}
*/


