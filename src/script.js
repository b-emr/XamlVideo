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
    thc;

    constructor(points, t1, t2, color, thc) {
        this.points = points;
        this.t1 = t1;
        this.t2 = t2;
        this.color = color;
        this.thc = thc;
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
let imageSrc;
let xamlString;
let swfWidth;
let swfHeight;
let xamlInfo;
let scale;
let intervalId;
const updateInterval = 10;
let params = new URLSearchParams(window.location.search);



//Initialization Parts
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

        const regex = /t1=(\d+)\s+t2=(\d+)/;
        const colorRegex = /color=(\d+)/;
        const thicknessRegex = /thc=(\d+)/;

        let thickness;
        const matchThickness = objMatch[0].match(thicknessRegex);
        if (matchThickness) {
            thickness = matchThickness[1];
        }
        thickness = parseInt(thickness);
        const matchTime = objMatch[0].match(regex);
        let t1;
        let t2;
        if (matchTime) {
            t1 = matchTime[1];
            t2 = matchTime[2];
        }
        let colorValue;
        const matchColor = objMatch[0].match(colorRegex);
        if(matchColor) {
            colorValue = matchColor[1];
        }
        let colorInt = parseInt(colorValue, 10);
        let lineColor = {
            r: (colorInt >> 16) & 0xFF,
            g: (colorInt >> 8) & 0xFF,
            b: colorInt & 0xFF
        };
        const pointList = points.map(x => x.split("|"));
        pointList.map(x => x[0] = x[0] * scale);
        pointList.map(y => y[1] = y[1] * scale);
        let pointData = [];
        pointList.forEach(point => pointData.push(new Point(point[0],point[1])));
        objects.push(new DrawingObject(pointData,t1/1000,t2/1000,lineColor,thickness));
    });
    console.log(objects);
}

function getIdFromUrl() {
    return parseInt(params.get("id"));
}

async function getData(id) {
    const apiURL = 'http://xamlvideo.pakodemy.com/api/question/' + id.toString();

    let response = await fetch(apiURL);

    return response.json();
}

async function initV2() {
    let questionId = getIdFromUrl();
    let response = await getData(questionId);
    console.log(response);
    imageSrc = response["imageUrl"];
    swfWidth = response["imageWidth"];
    swfHeight = response["imageHeight"];
    xamlString = response["xaml"];
    audio.src = "mp3output/"+response["id"]+".mp3";
    console.log(xamlString);
    canvasInit();
}

function canvasInit(){
    getXamlInfo(xamlString);
    resizeCanvas();
    getObjects(xamlString);
}

//Canvas Parts:
function updateCanvas() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < objects.length; i++) {

        let object = objects[i];
        let delay = object.t2/object.points.length;
        let color = `rgb(${object.color.r}, ${object.color.g}, ${object.color.b})`;
        console.log("color: ",color);
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
        ctx.lineWidth = object.thc*scale;
        ctx.stroke();
    }
}


await initV2();

window.addEventListener('resize', async function() {
    await canvasInit();
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

