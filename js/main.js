const imageInput = document.getElementById("image-input");
const puzzleColumnsInput = document.getElementById("puzzle-columns-input");
const puzzleRowsInput = document.getElementById("puzzle-rows-input");

const canvas = document.getElementById("puzzleCanvas");
const ctx = canvas.getContext("2d");

const pieces = [];
let selectedPiece = null;

let puzzleColumns = 0;
let puzzleRows = 0;

let sceneWidth = 400;
let sceneHeight = 400;

let pieceWidth;
let pieceHeight;

// in decimal percentage
const puzzleBoardPadding = 0.5;

let zoomLevel = 1; // 1-x (1 is full view visbile)
let viewOffsetX = 0; // 0-x
let viewOffsetY = 0; // 0-y

let prevMouseX = 0;
let prevMouseY = 0;

let imageSrc = null;
let image = new Image();
let imageScale = 1;

let showDebug = true;

setCanvasStyle();
function setCanvasStyle() {
  const mainWrapperElement = document
    .querySelector("main")
    .querySelector(".wrapper");
  canvas.width = mainWrapperElement.clientWidth;
  canvas.height = mainWrapperElement.clientHeight;
  ctx.font = "16px Arial";
  ctx.fillStyle = "red";

  zoomChange();
}
window.onresize = setCanvasStyle;

function generatePuzzle(event) {
  event.preventDefault();

  // Clear puzzle
  pieces.splice(0, pieces.length);

  if (imageInput.files.length <= 0) {
    console.warn("No file selected");
    imageShow.src = "#";
    imageSrc = "#";
    return;
  }
  imageFile = imageInput.files[0];

  const reader = new FileReader();
  reader.onload = function (e) {
    setCanvasStyle();

    imageSrc = e.target.result;
    imageShow.src = imageSrc;

    zoomLevel = 1;

    sceneWidth = canvas.width * zoomLevel;
    sceneHeight = canvas.height * zoomLevel;

    // Start in center
    viewOffsetX = (sceneWidth - canvas.width) / 2;
    viewOffsetY = (sceneHeight - canvas.height) / 2;

    puzzleColumns = parseInt(puzzleColumnsInput.value);
    puzzleRows = parseInt(puzzleRowsInput.value);

    // Load your image
    image = new Image();
    image.src = imageSrc;

    // Wait for the image to load
    image.onload = function () {
      // Cut the image into 4 rows and 4 columns
      pieceWidth = sceneWidth / (1 + puzzleBoardPadding) / puzzleColumns;
      pieceHeight = sceneHeight / (1 + puzzleBoardPadding) / puzzleRows;

      for (let row = 0; row < puzzleRows; row++) {
        for (let col = 0; col < puzzleColumns; col++) {
          // Create puzzle piece objects with position and size information
          const piece = {
            correctCol: col,
            correctRow: row,
            x: getRandomInt(sceneWidth - pieceWidth),
            y: getRandomInt(sceneHeight - pieceHeight),
            width: pieceWidth,
            height: pieceHeight,
            isDragging: false,
            offset: { x: 0, y: 0 }, // Offset from mouse click position to piece corner
            zIndex: pieces.length, // Assign z-order based on the order of creation
          };

          pieces.push(piece);
        }
      }

      // Add event listeners for mouse events
      canvas.addEventListener("mousedown", handleMouseDown);
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      // Add event listener for mouse wheel (for zooming)
      canvas.addEventListener("wheel", handleMouseWheel);

      // Draw the puzzle pieces on the canvas
      drawPuzzlePieces();

      closeGenerateModal();
    };
  };
  reader.readAsDataURL(imageFile);
}

function drawPuzzlePieces() {
  // Sort pieces based on z-order before drawing
  pieces.sort((a, b) => a.zIndex - b.zIndex);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  pieces.forEach((piece) => {
    // Draw only the corresponding part of the image for each puzzle piece
    ctx.drawImage(
      image,
      piece.correctCol *
        piece.width *
        (image.width / (sceneWidth / (1 + puzzleBoardPadding))),
      piece.correctRow *
        piece.height *
        (image.height / (sceneHeight / (1 + puzzleBoardPadding))),
      image.width / puzzleColumns,
      image.height / puzzleRows, // Source region (entire image)
      piece.x - viewOffsetX,
      piece.y - viewOffsetY,
      piece.width,
      piece.height // Destination region (scaled to fit the canvas)
    );
  });

  if (showDebug) {
    // Draw text on the canvas
    ctx.fillText("Zoom: " + zoomLevel + "x", 5, 21);
    ctx.fillText("Scene width: " + sceneWidth + "px", 5, 37);
    ctx.fillText("Scene height: " + sceneHeight + "px", 5, 53);
    ctx.fillText("Canvas width: " + canvas.width + "px", 5, 67);
    ctx.fillText("Canvas height: " + canvas.height + "px", 5, 83);
  }
}

function handleMouseDown(event) {
  // Check if the middle mouse button (scroll wheel) is pressed
  if (event.buttons === 4) {
    isMouseScrolling = true;
    prevMouseX = event.clientX;
    prevMouseY = event.clientY;

    return;
  }

  const globalMouseX = event.clientX - canvas.getBoundingClientRect().left;
  const globalMouseY = event.clientY - canvas.getBoundingClientRect().top;

  const mouseX = globalMouseX + viewOffsetX;
  const mouseY = globalMouseY + viewOffsetY;
  // const mouseY = globalMouseY / zoomLevel;

  // Check if the mouse is inside any puzzle piece
  // Start backwards to check them in ZIndex order, Top first
  for (let i = pieces.length - 1; i >= 0; i--) {
    const piece = pieces[i];

    if (
      mouseX >= piece.x &&
      mouseX <= piece.x + piece.width &&
      mouseY >= piece.y &&
      mouseY <= piece.y + piece.height
    ) {
      selectedPiece = piece;

      // Calculate the offset from the mouse click position to the piece corner
      selectedPiece.offset.x = mouseX - piece.x;
      selectedPiece.offset.y = mouseY - piece.y;

      // Bring the selected piece to the top of the z-order
      selectedPiece.zIndex = pieces.length - 1;
      // Place last top piece lower in zIndex
      pieces[pieces.length - 1].zIndex--;

      selectedPiece.isDragging = true;
      break;
    }
  }
}

function handleMouseMove(event) {
  let draw = false;

  if (selectedPiece && selectedPiece.isDragging) {
    const mouseX = event.clientX - canvas.getBoundingClientRect().left;
    const mouseY = event.clientY - canvas.getBoundingClientRect().top;

    let x = mouseX - selectedPiece.offset.x + viewOffsetX;
    let y = mouseY - selectedPiece.offset.y + viewOffsetY;

    x = Math.floor(x / (pieceWidth / 10)) * (pieceWidth / 10);
    y = Math.floor(y / (pieceWidth / 10)) * (pieceWidth / 10);

    selectedPiece.x = Math.min(
      Math.max(x, 0),
      sceneWidth - selectedPiece.width
    );
    selectedPiece.y = Math.min(
      Math.max(y, 0),
      sceneHeight - selectedPiece.height
    );

    draw = true;
  }

  // Check if the mouse scroll wheel is pressed
  if (event.buttons === 4) {
    // Update view offsets based on mouse movement
    viewOffsetX -= event.clientX - prevMouseX;
    viewOffsetY -= event.clientY - prevMouseY;

    viewOffsetX = Math.max(0, Math.min(sceneWidth - canvas.width, viewOffsetX));
    viewOffsetY = Math.max(
      0,
      Math.min(sceneHeight - canvas.height, viewOffsetY)
    );

    draw = true;
  }

  if (draw) {
    // Draw the puzzle pieces with the updated view offsets
    drawPuzzlePieces();
  }

  // Update previous mouse position
  prevMouseX = event.clientX;
  prevMouseY = event.clientY;
}

function handleMouseUp() {
  if (selectedPiece) {
    selectedPiece.isDragging = false;
    selectedPiece = null;
  }
}

function handleMouseWheel(event) {
  // Prevent the default behavior of the mouse wheel (e.g., page scrolling)
  event.preventDefault();

  // Adjust zoom level based on the direction of the mouse wheel
  zoomLevel += event.deltaY > 0 ? -0.1 : 0.1;

  // Ensure zoom level is within reasonable bounds
  zoomLevel = Math.max(1, Math.min(2, zoomLevel));
  zoomLevel = Math.floor(zoomLevel * 10) / 10;

  zoomChange();
}

function zoomChange() {
  const oldSceneWidth = sceneWidth;
  const oldSceneHeight = sceneHeight;

  sceneWidth = canvas.width * zoomLevel;
  sceneHeight = canvas.height * zoomLevel;

  viewOffsetX *= sceneWidth / oldSceneWidth;
  viewOffsetY *= sceneHeight / oldSceneHeight;

  viewOffsetX = Math.max(0, Math.min(sceneWidth - canvas.width, viewOffsetX));
  viewOffsetY = Math.max(0, Math.min(sceneHeight - canvas.height, viewOffsetY));

  pieceWidth = sceneWidth / (1 + puzzleBoardPadding) / puzzleColumns;
  pieceHeight = sceneHeight / (1 + puzzleBoardPadding) / puzzleRows;

  pieces.forEach((piece) => {
    piece.width = pieceWidth;
    piece.height = pieceHeight;
    piece.x *= sceneWidth / oldSceneWidth;
    piece.y *= sceneHeight / oldSceneHeight;
  });

  // Draw the puzzle pieces with the updated zoom level
  drawPuzzlePieces();
}

const generateModal = document.getElementById("generate-modal");
openGenerateModal();
generateModal.addEventListener("click", (event) => {
  if (event.target.nodeName !== "DIALOG") {
    return;
  }

  const rect = event.target.getBoundingClientRect();

  if (
    rect.left > event.clientX ||
    rect.right < event.clientX ||
    rect.top > event.clientY ||
    rect.bottom < event.clientY
  ) {
    closeGenerateModal();
  }
});
function openGenerateModal() {
  generateModal.showModal();
}
function closeGenerateModal() {
  generateModal.close();
}

const imageShowContainer = document.getElementById("image");
const imageShow = imageShowContainer.querySelector("img");
const toggleShowImageLabel = document.getElementById(
  "toggle-show-image__label"
);
function toggleShowImage(event) {
  if (event.target.checked) {
    imageShowContainer.style.display = "block";
    toggleShowImageLabel.innerText = "Image 🙉";
  } else {
    imageShowContainer.style.display = "none";
    toggleShowImageLabel.innerText = "Image 🙈";
  }
}

function toggleDebug(event) {
  showDebug = event.target.checked;

  drawPuzzlePieces();
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
