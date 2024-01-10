const imageInput = document.getElementById("image-input");
const puzzleColumnsInput = document.getElementById("puzzle-columns-input");
const puzzleRowsInput = document.getElementById("puzzle-rows-input");

const zoomInput = document.getElementById("zoom-input");

const victoryMessage = document.getElementById("victory-message");
const victoryTime = document.getElementById("victory-time");

const canvas = document.getElementById("puzzleCanvas");
const ctx = canvas.getContext("2d");

const pieces = [];
let piecesMatched = [];
let selectedPiece = null;
let hoveredPiece = null;

let puzzleColumns = 0;
let puzzleRows = 0;

let sceneWidth;
let sceneHeight;

let pieceSize;

// in decimal percentage
const puzzleBoardPadding = 0.5;

let zoomLevel = 1; // 1-x (1 is full view visbile)
const maxZoomLevel = 5;
let viewOffsetX = 0; // 0-x
let viewOffsetY = 0; // 0-y

let panningView = false;
let panningViewLocked = false;

let prevMouseX = 0;
let prevMouseY = 0;

let imageSrc = null;
let image = new Image();
let imageScale = 1;

let showDebug = false;

function setCanvasStyle() {
  const mainWrapperElement = document
    .querySelector("main")
    .querySelector(".wrapper");
  canvas.width = mainWrapperElement.clientWidth;
  canvas.height = mainWrapperElement.clientHeight;

  ctx.font = "16px Arial";

  zoomChange();
}
setCanvasStyle();
window.onresize = setCanvasStyle;

function generatePuzzle(event) {
  event.preventDefault();

  // Clear puzzle
  pieces.splice(0, pieces.length);
  piecesMatched.splice(0, piecesMatched.length);
  victoryMessage.classList.remove("active");

  if (imageInput.files.length <= 0) {
    console.warn("No file selected");
    imageShow.src = "#";
    imageSrc = "#";
    return;
  }
  imageFile = imageInput.files[0];

  const reader = new FileReader();
  reader.onload = function (e) {
    // Load image
    imageSrc = e.target.result;
    imageShow.src = imageSrc;
    image = new Image();
    image.src = imageSrc;

    // Wait for the image to load
    image.onload = function () {
      setCanvasStyle();

      puzzleColumns = parseInt(puzzleColumnsInput.value);
      puzzleRows = parseInt(puzzleRowsInput.value);

      // Reset settings
      zoomLevel = 1;
      zoomInput.querySelector("span").textContent =
        Math.round(zoomLevel * 100) + "%";
      panningView = false;
      panningViewLocked = false;
      document.getElementById("pan-input").checked = false;
      imageShowContainer.style.display = "none";
      toggleShowImageLabel.innerText = "🖼🙈";
      document.getElementById("toggle-show-image").checked = false;

      sceneWidth = canvas.width * zoomLevel;
      sceneHeight = canvas.height * zoomLevel;

      // Start in center
      viewOffsetX = (sceneWidth - canvas.width) / 2;
      viewOffsetY = (sceneHeight - canvas.height) / 2;

      // Cut the image into 4 rows and 4 columns
      pieceSize = getNewPieceSize();

      for (let row = 0; row < puzzleRows; row++) {
        for (let col = 0; col < puzzleColumns; col++) {
          // Create puzzle piece objects with position and size information
          const piece = {
            id: row * puzzleColumns + col,
            correctCol: col,
            correctRow: row,
            x:
              Math.round(
                getRandomInt(sceneWidth - pieceSize) / (pieceSize / 10)
              ) *
              (pieceSize / 10),
            y:
              Math.round(
                getRandomInt(sceneHeight - pieceSize) / (pieceSize / 10)
              ) *
              (pieceSize / 10),
            isDragging: false,
            offset: { x: 0, y: 0 }, // Offset from mouse click position to piece corner
          };

          pieces.push(piece);
          piecesMatched.push([piece.id]);
        }
      }

      // Add event listeners for mouse events
      canvas.addEventListener("mousedown", handleMouseDown);
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      // Add event listener for mouse wheel (for zooming)
      canvas.addEventListener("wheel", handleMouseWheel);

      // Draw the puzzle pieces on the canvas
      drawCanvas();

      // Reset timer
      restartTimer();

      closeGenerateModal();
    };
  };
  reader.readAsDataURL(imageFile);
}

function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  pieces.forEach((piece) => {
    // Draw only the corresponding part of the image for each puzzle piece
    ctx.drawImage(
      image,
      piece.correctCol *
        pieceSize *
        (image.width / (pieceSize * puzzleColumns)),
      piece.correctRow * pieceSize * (image.height / (pieceSize * puzzleRows)),
      image.width / puzzleColumns,
      image.height / puzzleRows, // Source region (entire image)
      piece.x - viewOffsetX,
      piece.y - viewOffsetY,
      pieceSize,
      pieceSize // Destination region (scaled to fit the canvas)
    );
  });

  if (panningView || panningViewLocked) {
    // Draw pan view
    ctx.fillStyle = "rgba(224, 224, 224, 0.2)";
    const panViewWidth = canvas.width / 5;
    const panViewHeight = panViewWidth / (16 / 9);
    const panViewOffset = canvas.width / 100;
    ctx.fillRect(
      panViewOffset,
      canvas.height - panViewHeight - panViewOffset,
      panViewWidth,
      panViewHeight
    );
    const canvasToPanViewMultiplier = panViewWidth / sceneWidth;
    ctx.fillRect(
      panViewOffset + viewOffsetX * canvasToPanViewMultiplier,
      canvas.height -
        panViewOffset -
        panViewHeight +
        viewOffsetY * canvasToPanViewMultiplier,
      panViewWidth / zoomLevel,
      panViewHeight / zoomLevel
    );
  }

  if (showDebug) {
    // Draw text on the canvas
    ctx.fillStyle = "rgba(224, 224, 224, 1)";
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
    startPanningView(event.clientX, event.clientY);

    return;
  } else if (event.buttons === 1) {
    if (hoveredPiece) {
      selectedPiece = hoveredPiece;

      const mouseX =
        event.clientX - canvas.getBoundingClientRect().left + viewOffsetX;
      const mouseY =
        event.clientY - canvas.getBoundingClientRect().top + viewOffsetY;

      // Calculate the offset from the mouse click position to the piece corner
      selectedPiece.offset.x = mouseX - selectedPiece.x;
      selectedPiece.offset.y = mouseY - selectedPiece.y;

      // Bring the selected piece group to the top of the z-order
      // by moving the pieces in the group to end of array
      const selectedPieceGroupIndex = findIndexWithElement(
        piecesMatched,
        selectedPiece.id
      );
      piecesMatched[selectedPieceGroupIndex].forEach((_pieceId) => {
        movePieceToLast(_pieceId);
      });

      selectedPiece.isDragging = true;
      document.body.style.cursor = "grabbing";

      drawCanvas();
      return;
    }

    // Pressing on board
    startPanningView(event.clientX, event.clientY);
  }
}
function startPanningView(_clientX, _clientY) {
  panningView = true;

  prevMouseX = _clientX;
  prevMouseY = _clientY;

  document.body.style.cursor = "all-scroll";
}
function panView(_clientX, _clientY) {
  panningView = true;
  document.body.style.cursor = "all-scroll";

  // Update view offsets based on mouse movement
  viewOffsetX -= _clientX - prevMouseX;
  viewOffsetY -= _clientY - prevMouseY;

  viewOffsetX = Math.max(0, Math.min(sceneWidth - canvas.width, viewOffsetX));
  viewOffsetY = Math.max(0, Math.min(sceneHeight - canvas.height, viewOffsetY));
}
function movePieceToLast(_pieceId) {
  // Find the index of the object in the array
  const index = pieces.findIndex((_piece) => _piece.id === _pieceId);
  const piece = pieces[index];

  // If the object is found in the array
  if (index !== -1) {
    // Remove the object from its current position
    pieces.splice(index, 1);

    // Add the object to the last position in the array
    pieces.push(piece);
  }
}

function handleMouseMove(event) {
  let draw = false;

  const mouseX =
    event.clientX - canvas.getBoundingClientRect().left + viewOffsetX;
  const mouseY =
    event.clientY - canvas.getBoundingClientRect().top + viewOffsetY;

  // Check if the mouse is inside any puzzle piece
  // Start backwards to check them in order, Top first
  let isHoveringPiece = false;
  for (let i = pieces.length - 1; i >= 0; i--) {
    const piece = pieces[i];
    if (
      mouseX >= piece.x &&
      mouseX <= piece.x + pieceSize &&
      mouseY >= piece.y &&
      mouseY <= piece.y + pieceSize
    ) {
      isHoveringPiece = true;
      hoveredPiece = piece;
      break;
    }
  }
  if (!isHoveringPiece) {
    hoveredPiece = null;
  }

  if (selectedPiece && selectedPiece.isDragging) {
    let x = mouseX - selectedPiece.offset.x;
    let y = mouseY - selectedPiece.offset.y;

    x = Math.min(Math.max(x, 0), sceneWidth - pieceSize);
    y = Math.min(Math.max(y, 0), sceneHeight - pieceSize);

    x = Math.round(Math.floor(x / (pieceSize / 10)) * (pieceSize / 10));
    y = Math.round(Math.floor(y / (pieceSize / 10)) * (pieceSize / 10));

    const xDifference = x - selectedPiece.x;
    const yDifference = y - selectedPiece.y;

    const selectedPieceGroupIndex = findIndexWithElement(
      piecesMatched,
      selectedPiece.id
    );

    piecesMatched[selectedPieceGroupIndex].forEach((_pieceId) => {
      const _pieceIndex = pieces.findIndex((_piece) => _piece.id === _pieceId);

      pieces[_pieceIndex].x += xDifference;
      pieces[_pieceIndex].y += yDifference;
    });

    draw = true;
  } else if (hoveredPiece) {
    document.body.style.cursor = "grab";
  } else {
    document.body.style.cursor = "default";
  }

  // Check if the mouse scroll wheel is pressed
  if (panningView || event.buttons === 4 || panningViewLocked) {
    panView(event.clientX, event.clientY);

    draw = true;
  }

  if (draw) {
    // Draw the puzzle pieces with the updated view offsets
    drawCanvas();
  }

  // Update previous mouse position
  prevMouseX = event.clientX;
  prevMouseY = event.clientY;
}

function handleMouseUp() {
  if (selectedPiece) {
    // Check if piece got dropped beside correct matching piece
    matchWithSurroundingPieces(selectedPiece);

    // Drop selected piece
    selectedPiece.isDragging = false;
    selectedPiece = null;

    checkIfPuzzleDone();
  }

  panningView = false;

  if (hoveredPiece) {
    document.body.style.cursor = "grab";
  } else {
    document.body.style.cursor = "default";
  }

  drawCanvas();
}

function matchWithSurroundingPieces(_selectedPiece) {
  const correctAdjacentPieces = pieces.filter(
    (piece) =>
      (_selectedPiece.correctCol === piece.correctCol &&
        Math.abs(_selectedPiece.correctRow - piece.correctRow) === 1) ||
      (_selectedPiece.correctRow === piece.correctRow &&
        Math.abs(_selectedPiece.correctCol - piece.correctCol) === 1)
  );

  // Put adjecantPieces and selectedPiece in same array in piecesMatched
  correctAdjacentPieces.forEach((adjacentPiece) => {
    // Check if the pieces are in the same row or column
    const sameRow = _selectedPiece.correctRow === adjacentPiece.correctRow;
    const sameCol = _selectedPiece.correctCol === adjacentPiece.correctCol;

    if (
      (sameRow &&
        _selectedPiece.correctCol - adjacentPiece.correctCol ===
          (_selectedPiece.x - adjacentPiece.x) / pieceSize &&
        _selectedPiece.y == adjacentPiece.y) ||
      (sameCol &&
        _selectedPiece.correctRow - adjacentPiece.correctRow ===
          (_selectedPiece.y - adjacentPiece.y) / pieceSize &&
        _selectedPiece.x == adjacentPiece.x)
    ) {
      const adjacentPieceGroupIndex = findIndexWithElement(
        piecesMatched,
        adjacentPiece.id
      );

      const selectedPieceGroupIndex = findIndexWithElement(
        piecesMatched,
        _selectedPiece.id
      );
      if (adjacentPieceGroupIndex == selectedPieceGroupIndex) {
        // Already in same group
        return;
      }

      piecesMatched[adjacentPieceGroupIndex] = piecesMatched[
        adjacentPieceGroupIndex
      ].concat(piecesMatched[selectedPieceGroupIndex]);
      piecesMatched.splice(selectedPieceGroupIndex, 1);
    }
  });
}
function findIndexWithElement(arrays, element) {
  for (let i = 0; i < arrays.length; i++) {
    if (arrays[i].includes(element)) {
      return i;
    }
  }
  return -1; // Element not found in any array
}

function checkIfPuzzleDone() {
  if (piecesMatched.length == 1) {
    puzzleDone();
  }
}
function puzzleDone() {
  stopTimer();

  victoryMessage.classList.add("active");
  victoryTime.innerText = formatTime(hours, minutes, seconds);
}

function handleMouseWheel(event) {
  // Prevent the default behavior of the mouse wheel (e.g., page scrolling)
  event.preventDefault();

  // Adjust zoom level based on the direction of the mouse wheel
  zoom(event.deltaY > 0 ? -0.1 : 0.1);
}

const zoomStartDelay = 400;
const zoomMinDelay = 40;
let currentZoomDelay;
let zoomIntervalId;
function startZooming(zoomValue) {
  zoom(zoomValue);

  currentZoomDelay = zoomStartDelay;
  autoZoom(zoomValue);
}
function autoZoom(zoomValue) {
  zoomIntervalId = setInterval(() => {
    zoom(zoomValue);

    currentZoomDelay = Math.max(
      currentZoomDelay - (zoomStartDelay * 40) / currentZoomDelay,
      zoomMinDelay
    );

    // Start next autozoom interval with new zoomdelay
    clearInterval(zoomIntervalId);
    autoZoom(zoomValue);
  }, currentZoomDelay);
}
function stopZooming() {
  clearInterval(zoomIntervalId);
}
function zoom(zoomValue) {
  zoomLevel += zoomValue;

  // Ensure zoom level is within reasonable bounds
  zoomLevel = Math.max(1, Math.min(zoomLevel, maxZoomLevel));
  zoomLevel = Math.round(zoomLevel * 10) / 10;

  zoomChange();
}
function zoomChange() {
  const oldSceneWidth = sceneWidth;
  const oldSceneHeight = sceneHeight;

  sceneWidth = canvas.width * zoomLevel;
  sceneHeight = canvas.height * zoomLevel;

  const sceneWidthDelta = sceneWidth - oldSceneWidth;
  const sceneHeightDelta = sceneHeight - oldSceneHeight;

  viewOffsetX +=
    ((prevMouseX - canvas.getBoundingClientRect().left) / canvas.width) *
    sceneWidthDelta;
  viewOffsetY +=
    ((prevMouseY - canvas.getBoundingClientRect().top) / canvas.height) *
    sceneHeightDelta;

  viewOffsetX = Math.max(0, Math.min(sceneWidth - canvas.width, viewOffsetX));
  viewOffsetY = Math.max(0, Math.min(sceneHeight - canvas.height, viewOffsetY));

  // Make puzzle contain as much space as it can leaving the padding and
  // without stretching the pieces
  const oldPieceSize = pieceSize;
  pieceSize = getNewPieceSize();

  const newScaleMultiplier = pieceSize / oldPieceSize;

  pieces.forEach((piece) => {
    piece.x *= newScaleMultiplier;
    piece.y *= newScaleMultiplier;
  });

  drawCanvas();

  // Set UI
  zoomInput.querySelector("span").textContent =
    Math.round(zoomLevel * 100) + "%";
}

function getNewPieceSize() {
  return Math.round(
    Math.min(
      sceneWidth / (1 + puzzleBoardPadding) / puzzleColumns,
      sceneHeight / (1 + puzzleBoardPadding) / puzzleRows
    )
  );
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
    toggleShowImageLabel.innerText = "🖼🙉";
  } else {
    imageShowContainer.style.display = "none";
    toggleShowImageLabel.innerText = "🖼🙈";
  }
}

function setDebug(event) {
  showDebug = event.target.checked;

  drawCanvas();
}

function setPanning(event) {
  panningViewLocked = event.target.checked;

  drawCanvas();
}

const timerText = document.getElementById("timer");
let hours = 0;
let minutes = 0;
let seconds = 0;
let timerIntervalId; // Variable to store the interval ID
// Function to format the time as hh:mm:ss
function formatTime(hours, minutes, seconds) {
  return (
    String(hours).padStart(2, "0") +
    ":" +
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0")
  );
}
// Function to update the timer
function updateTimer() {
  seconds++;

  if (seconds === 60) {
    seconds = 0;
    minutes++;

    if (minutes === 60) {
      minutes = 0;
      hours++;
    }
  }

  timerText.innerText = formatTime(hours, minutes, seconds);
}
function stopTimer() {
  clearInterval(timerIntervalId);
}
function startTimer() {
  // Update the timer every second
  timerIntervalId = setInterval(updateTimer, 1000);
}
function restartTimer() {
  stopTimer();
  hours = 0;
  minutes = 0;
  seconds = 0;
  timerText.innerText = formatTime(hours, minutes, seconds);
  startTimer();
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
