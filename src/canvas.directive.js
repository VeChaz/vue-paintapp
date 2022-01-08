import { v4 } from 'uuid';
import Pusher from 'pusher-js';
import { fabric } from 'fabric';

function inserted(el) {
  const canvas = el;
  const ctx = canvas.getContext('2d');

  // Fabric
  var canvas1 = new fabric.Canvas('whiteboard');
  // document.getElementById("add-rect").onclick = function() {onSolidRect()};
  // function onSolidRect() {
 
  //   var rect = new fabric.Rect({ 
  //      top: 100,
  //      left: 100,
  //      width: 60,
  //      height: 70,
  //      fill: '',
  //      selection: false,
  //      fill: '#f55', 
  //  });
    
  //  canvas1.add(rect);

  canvas1.add(
    new fabric.Rect({ top: 100, left: 100, width: 50, height: 50, fill: '#f55' }),
    new fabric.Circle({ top: 140, left: 230, radius: 75, fill: 'green' }),
    new fabric.Triangle({ top: 300, left: 210, width: 100, height: 100, fill: 'blue' })
    );
   
   fabric.Image.fromURL('https://upload.wikimedia.org/wikipedia/commons/d/d7/Sad-pug.jpg', function(img) {
    img.set({ left: 400, top: 350, angle: 30});
    img.scaleToHeight(100);
    img.scaleToWidth(200);
    canvas.add(img);
    });
   
   canvas1.isDrawingMode = true; //For free hand drawing
    
  

  canvas.width = 1000;
  canvas.height = 800;

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = 5;

  const pusher = new Pusher('2fb78f50662d40bd00bf', {
    cluster: 'us2',
  });
  const channel = pusher.subscribe('painting');

  let prevPos = { offsetX: 0, offsetY: 0 };
  let line = [];
  let isPainting = false;
  const userId = v4();
  const USER_STROKE = 'red';
  const GUEST_STROKE = 'greenyellow';

  function handleMouseDown(e) {
    const { offsetX, offsetY } = e;
    isPainting = true;
    prevPos = { offsetX, offsetY };
  }

  function endPaintEvent() {
    if (isPainting) {
      isPainting = false;
      sendPaintData();
    }
  }

  function handleMouseMove(e) {
    if (isPainting) {
      const { offsetX, offsetY } = e;
      const offSetData = { offsetX, offsetY };
      const positionInfo = {
        start: { ...prevPos },
        stop: { ...offSetData },
      };
      line = line.concat(positionInfo);
      paint(prevPos, offSetData, USER_STROKE);
    }
  }

  function sendPaintData() {
    const body = {
      line,
      userId,
    };

    fetch('http://localhost:4000/paint', {
      method: 'post',
      body: JSON.stringify(body),
      headers: {
        'content-type': 'application/json',
      },
    }).then(() => (line = []));
  }

  function paint(prevPosition, currPosition, strokeStyle) {
    const { offsetX, offsetY } = currPosition;
    const { offsetX: x, offsetY: y } = prevPosition;

    ctx.beginPath();
    ctx.strokeStyle = strokeStyle;
    ctx.moveTo(x, y);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
    prevPos = { offsetX, offsetY };
  }

  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseup', endPaintEvent);
  canvas.addEventListener('mouseleave', endPaintEvent);
  channel.bind('draw', (data) => {
    const { userId: id, line } = data;

    if (userId !== id) {
      line.forEach((position) => {
        paint(position.start, position.stop, GUEST_STROKE);
      });
    }
  });
}

export default {
  inserted,
};
