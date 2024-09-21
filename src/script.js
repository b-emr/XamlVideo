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
let csvRows = [];
let imageSrc;
let xamlString;
let swfWidth;
let swfHeight;
let xamlInfo;
let scale;
let intervalId;
const updateInterval = 10;

let question = 11;
let csv_file = "player_infos.csv";


//Initialization Parts
async function getFromCsv(filePath) {
    let response = await fetch(filePath);
    response = await response.text();
    return response.split('\n').map(row => row.split(','))
}

function setDatas(questionIndex) {
    imageSrc = csvRows[questionIndex][1];
    swfWidth = csvRows[questionIndex][2];
    swfHeight = csvRows[questionIndex][3];
    xamlString = csvRows[questionIndex][4];
    audio.src = "mp3output/"+csvRows[questionIndex][0]+".mp3";
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

    audio.style.width = viewportWidth-50 + 'px';
    $("#content").css('height', canvasHeight);
    $("#content").css('margin-top', ($(window).height() - $('#player').height()-canvasHeight) / 2);
}

function getObjects(xamlString) {

    function extractAttributeValue(element, attributeName, defaultValue) {
        const pattern = new RegExp(`${attributeName}="\"\""(.*?)"`);
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

        var regex = /t1=""([^""]+)"" t2=""([^""]+)""/;
        let match = objMatch[0].match(regex);
        let t1;
        let t2;
        if (match) {
            t1 = match[1];
            t2 = match[2];
        }
        //let t1 = parseFloat(extractAttributeValue(objMatch[0], "t1", "0"));
        //let t2 = parseFloat(extractAttributeValue(objMatch[0], "t2", "0"));
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
    console.log(objects);
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

        ctx.strokeStyle = color;
        ctx.lineWidth = 2*scale;
        ctx.stroke();
    }
}


async function Initialize(){
    csvRows = await getFromCsv(csv_file);
    setDatas(question);
    getXamlInfo(xamlString);
    resizeCanvas();
    getObjects(xamlString);
}

await Initialize();

window.addEventListener('resize', async function() {
    await Initialize();
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

