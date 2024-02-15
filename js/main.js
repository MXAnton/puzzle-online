/*
------------------------------
BEGIN:  __ VARS DECLARATION __
*/

//#region VARS - CANVAS & SCENE
let sceneWidth;
let sceneHeight;

const puzzleBoardPadding = 0.5; // in decimal percentage

const mainCanvas = document.getElementById("main-canvas");
const selectedPiecesCanvas = document.getElementById("selected-pieces-canvas");
const markCanvas = document.getElementById("mark-canvas");
const panViewCanvas = document.getElementById("pan-view-canvas");
const debugCanvas = document.getElementById("debug-canvas");

const mainCtx = mainCanvas.getContext("2d");
const selectedPiecesCtx = selectedPiecesCanvas.getContext("2d");
const markCtx = markCanvas.getContext("2d");
const panViewCtx = panViewCanvas.getContext("2d");
const debugCtx = debugCanvas.getContext("2d");

const puzzleWrapper = document.getElementById("puzzle-wrapper");

let viewOffsetX = 0; // 0-x
let viewOffsetY = 0; // 0-y
//#endregion

//#region VARS - PUZZLE PIECES
let pieceSize;
const tabSizeDecimal = 0.2; // Decimal of pieceSize

const pieceMatchDistanceDecimal = 0.2; // Decimal of pieceSize

const pieces = [];
let piecesMatched = [];
let selectedPiece = null;
let hoveredPiece = null;

const puzzleSizeInput = document.getElementById("puzzle-size-input");

let puzzleColumns = 0;
let puzzleRows = 0;

const piecesText = document.getElementById("pieces");
//#endregion

//#region VARS - GENERATE PUZZLE
const generateModal = document.getElementById("generate-modal");
//#endregion

//#region VARS - CONTROLS INFO
const controlsModal = document.getElementById("controls-modal");
//#endregion

//#region VARS - ZOOM
const zoomInput = document.getElementById("zoom-input");

let zoomLevel = 1; // 1-x (1 is full view visbile)
const maxZoomLevel = 5;

const zoomStartDelay = 400;
const zoomMinDelay = 40;
let currentZoomDelay;
let zoomIntervalId;
//#endregion

//#region VARS - PAN VIEW
let panningView = false;
let panningViewLocked = false;
//#endregion

//#region VARS - IMAGE
const imageInput = document.getElementById("image-input");

let imageSrc = null;
let image = new Image();

const imageShowContainer = document.getElementById("image");
const imageShow = imageShowContainer.querySelector("img");
const toggleShowImageLabel = document.getElementById(
  "toggle-show-image__label"
);
//#endregion

//#region VARS - DEBUG
let showDebug = false;
//#endregion

//#region VARS - MARK MULTIPLE PIECES
let markedGroups = [];
let markMade = false;
let markHovered = false;
let markDragged = false;
let markStartX = null;
let markStartY = null;
let markEndX = null;
let markEndY = null;
let markGrabOffsetX;
let markGrabOffsetY;
//#endregion

//#region VARS - GAME MUSIC
const gameMusicElement = document.getElementById("game-music");
const musicInputWrapper = document.getElementById("music-input__wrapper");

let musicOff = false;
//#endregion

//#region VARS - SOUND EFFECTS
const popSoundElement = document.getElementById("pop-sound");
const successSoundElement = document.getElementById("success-sound");
//#endregion

//#region VARS - GAME TIMER
const timerText = document.getElementById("timer");
let hours = 0;
let minutes = 0;
let seconds = 0;
let timerIntervalId; // Variable to store the interval ID

const pauseInput = document.getElementById("pause-input");
const pauseInputLabel = document.getElementById("pause-input__label");
const pausedMessage = document.getElementById("paused-message");
//#endregion

//#region VARS - PUZZLE COMPLETION
const victoryMessage = document.getElementById("victory-message");
const victoryTime = document.getElementById("victory-time");

let isPuzzleDone = null;
//#endregion

//#region VARS - GENERAL
let prevMouseX = 0;
let prevMouseY = 0;
//#endregion

/*
END:    ‾‾ VARS DECLARATION ‾‾
------------------------------
*/

/*
------------------------------
BEGIN:  _____ FUNCTIONS ______
*/

//#region CANVAS
// Prevent the default right-click behavior
mainCanvas.addEventListener("contextmenu", (_event) => _event.preventDefault());
selectedPiecesCanvas.addEventListener("contextmenu", (_event) =>
  _event.preventDefault()
);
markCanvas.addEventListener("contextmenu", (_event) => _event.preventDefault());
panViewCanvas.addEventListener("contextmenu", (_event) =>
  _event.preventDefault()
);
debugCanvas.addEventListener("contextmenu", (_event) =>
  _event.preventDefault()
);

function setCanvasSize() {
  mainCanvas.width = puzzleWrapper.clientWidth;
  mainCanvas.height = puzzleWrapper.clientHeight;
  selectedPiecesCanvas.width = puzzleWrapper.clientWidth;
  selectedPiecesCanvas.height = puzzleWrapper.clientHeight;
  markCanvas.width = puzzleWrapper.clientWidth;
  markCanvas.height = puzzleWrapper.clientHeight;
  panViewCanvas.width = puzzleWrapper.clientWidth;
  panViewCanvas.height = puzzleWrapper.clientHeight;
  debugCanvas.width = puzzleWrapper.clientWidth;
  debugCanvas.height = puzzleWrapper.clientHeight;

  debugCtx.font = "16px Arial";

  zoomChange();
}
setCanvasSize();
window.onresize = setCanvasSize;

function drawMainCanvas() {
  mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);

  if (piecesMatched.length <= 1 && selectedPiece != null) {
    // Pieces are all matched or not generated
    // Nothing to draw in this function
    // If pieces are generated they are also all selected
    //  which means all pieces will be drawn in drawSelectedPieces()
    return;
  }

  const tabSize = pieceSize * tabSizeDecimal;

  const imageScaleMultiplierX = image.width / (pieceSize * puzzleColumns);
  const imageScaleMultiplierY = image.height / (pieceSize * puzzleRows);
  const pieceImageWidth = image.width / puzzleColumns;
  const pieceImageHeight = image.height / puzzleRows;

  let selectedPieceGroupIndex = null;
  if (selectedPiece != null) {
    selectedPieceGroupIndex = findIndexWithElement(
      piecesMatched,
      selectedPiece.id
    );
  }

  const markedPieces = [].concat(...markedGroups);

  pieces.forEach((piece) => {
    if (
      piece == selectedPiece ||
      (selectedPieceGroupIndex != null &&
        piecesMatched[selectedPieceGroupIndex].includes(piece.id)) ||
      (markedPieces != null && markedPieces.includes(piece.id))
    ) {
      // Selected pieces gets drawn independently in drawSelectedPieces()
      return;
    }

    const pieceCanvasX = piece.x - viewOffsetX;
    const pieceCanvasY = piece.y - viewOffsetY;

    if (
      pieceCanvasX + pieceSize + tabSize < 0 ||
      pieceCanvasX - tabSize > mainCanvas.width ||
      pieceCanvasY + pieceSize + tabSize < 0 ||
      pieceCanvasY - tabSize > mainCanvas.height
    ) {
      // Piece outside of canvas, no need to draw
      return;
    }

    // Draw only the corresponding part of the image for each puzzle piece
    const pieceCorrectX = piece.correctCol * pieceSize;
    const pieceCorrectY = piece.correctRow * pieceSize;
    const pieceImageX = pieceCorrectX * imageScaleMultiplierX;
    const pieceImageY = pieceCorrectY * imageScaleMultiplierY;

    mainCtx.save();

    // Draw tabs based on the piece.tabs object
    let piecePath = getNewPiecePath(
      piece.tabs,
      pieceCanvasX,
      pieceCanvasY,
      tabSize
    );

    mainCtx.clip(piecePath);
    mainCtx.drawImage(
      image,
      pieceImageX - tabSize * imageScaleMultiplierX,
      pieceImageY - tabSize * imageScaleMultiplierY,
      pieceImageWidth * (1 + tabSizeDecimal * 2),
      pieceImageHeight * (1 + tabSizeDecimal * 2), // Source region (entire image)
      pieceCanvasX - tabSize,
      pieceCanvasY - tabSize,
      pieceSize + tabSize * 2,
      pieceSize + tabSize * 2 // Destination region (scaled to fit the mainCanvas)
    );

    mainCtx.restore();
  });
}

function drawSelectedPieces() {
  selectedPiecesCtx.clearRect(
    0,
    0,
    selectedPiecesCanvas.width,
    selectedPiecesCanvas.height
  );

  // Set piece vars
  const tabSize = pieceSize * tabSizeDecimal;
  const imageScaleMultiplierX = image.width / (pieceSize * puzzleColumns);
  const imageScaleMultiplierY = image.height / (pieceSize * puzzleRows);
  const pieceImageWidth = image.width / puzzleColumns;
  const pieceImageHeight = image.height / puzzleRows;

  let piecesToDraw = [];

  // Add selectedPiece and its matched pieces to piecesToDraw
  if (selectedPiece != null) {
    const selectedPieceGroupIndex = findIndexWithElement(
      piecesMatched,
      selectedPiece.id
    );

    piecesMatched[selectedPieceGroupIndex].forEach((_pieceId) => {
      piecesToDraw.push(pieces.find((_piece) => _piece.id === _pieceId));
    });
  }

  // Add marked pieces to pieces to draw
  if (markedGroups != null) {
    const markedPieces = [].concat(...markedGroups);

    markedPieces.forEach((_pieceId) => {
      piecesToDraw.push(pieces.find((_piece) => _piece.id === _pieceId));
    });
  }

  if (piecesToDraw == null || piecesToDraw.length == 0) {
    return;
  }

  piecesToDraw.forEach((piece) => {
    if (piece == null) {
      console.warn("Can't draw piece that is undefined or null");
      return;
    }

    const pieceCanvasX = piece.x - viewOffsetX;
    const pieceCanvasY = piece.y - viewOffsetY;

    if (
      pieceCanvasX + pieceSize + tabSize < 0 ||
      pieceCanvasX - tabSize > selectedPiecesCanvas.width ||
      pieceCanvasY + pieceSize + tabSize < 0 ||
      pieceCanvasY - tabSize > selectedPiecesCanvas.height
    ) {
      // Piece outside of canvas, no need to draw
      return;
    }

    // Draw only the corresponding part of the image for each puzzle piece
    const pieceCorrectX = piece.correctCol * pieceSize;
    const pieceCorrectY = piece.correctRow * pieceSize;
    const pieceImageX = pieceCorrectX * imageScaleMultiplierX;
    const pieceImageY = pieceCorrectY * imageScaleMultiplierY;

    selectedPiecesCtx.save();

    // Draw tabs based on the piece.tabs object
    let piecePath = getNewPiecePath(
      piece.tabs,
      pieceCanvasX,
      pieceCanvasY,
      tabSize
    );

    if (selectedPiece && piece.id == selectedPiece.id) {
      // Add shadow behind selected piece
      selectedPiecesCtx.fillStyle = "rgba(0, 0, 0, 0.4)";

      // Apply the scale transformation to the context
      selectedPiecesCtx.translate(pieceSize / 20, pieceSize / 20);

      // Fill scaled path with shadow color
      selectedPiecesCtx.fill(piecePath);

      // Reset the transformation to avoid affecting future drawings
      selectedPiecesCtx.setTransform(1, 0, 0, 1, 0, 0);
    }

    selectedPiecesCtx.clip(piecePath);
    selectedPiecesCtx.drawImage(
      image,
      pieceImageX - tabSize * imageScaleMultiplierX,
      pieceImageY - tabSize * imageScaleMultiplierY,
      pieceImageWidth * (1 + tabSizeDecimal * 2),
      pieceImageHeight * (1 + tabSizeDecimal * 2), // Source region (entire image)
      pieceCanvasX - tabSize,
      pieceCanvasY - tabSize,
      pieceSize + tabSize * 2,
      pieceSize + tabSize * 2 // Destination region (scaled to fit the mainCanvas)
    );

    selectedPiecesCtx.restore();
  });
}

function drawMark() {
  markCtx.clearRect(0, 0, markCanvas.width, markCanvas.height);

  if (markStartX != null) {
    // Draw mark
    const panViewWidth = Math.abs(markStartX - markEndX);
    const panViewHeight = Math.abs(markStartY - markEndY);

    markCtx.fillStyle = "rgba(255, 255, 255, 0.1)";
    if (markDragged) {
      // Add shadow behind selected piece
      markCtx.fillStyle = "rgba(255, 255, 255, 0.2)";
    }

    markCtx.fillRect(
      Math.min(markStartX, markEndX) - viewOffsetX,
      Math.min(markStartY, markEndY) - viewOffsetY,
      panViewWidth,
      panViewHeight
    );

    // Set the stroke color to black
    markCtx.strokeStyle = "black";
    // Draw outline
    markCtx.strokeRect(
      Math.min(markStartX, markEndX) - viewOffsetX,
      Math.min(markStartY, markEndY) - viewOffsetY,
      panViewWidth,
      panViewHeight
    );
  }
}

function drawPanView() {
  panViewCtx.clearRect(0, 0, panViewCanvas.width, panViewCanvas.height);

  if (panningView || panningViewLocked) {
    // Draw pan view
    panViewCtx.fillStyle = "rgba(224, 224, 224, 0.2)";
    const panViewWidth = panViewCanvas.width / 5;
    const panViewHeight = panViewWidth / (16 / 9);
    const panViewOffset = panViewCanvas.width / 100;
    panViewCtx.fillRect(
      panViewOffset,
      panViewCanvas.height - panViewHeight - panViewOffset,
      panViewWidth,
      panViewHeight
    );
    const canvasToPanViewMultiplier = panViewWidth / sceneWidth;
    panViewCtx.fillRect(
      panViewOffset + viewOffsetX * canvasToPanViewMultiplier,
      panViewCanvas.height -
        panViewOffset -
        panViewHeight +
        viewOffsetY * canvasToPanViewMultiplier,
      panViewWidth / zoomLevel,
      panViewHeight / zoomLevel
    );
  }
}

function drawDebug() {
  debugCtx.clearRect(0, 0, debugCanvas.width, debugCanvas.height);

  if (showDebug) {
    // Draw text on the canvas
    debugCtx.fillStyle = "rgba(224, 224, 224, 1)";
    debugCtx.fillText("Zoom: " + zoomLevel + "x", 5, 21);
    debugCtx.fillText("Scene width: " + sceneWidth + "px", 5, 37);
    debugCtx.fillText("Scene height: " + sceneHeight + "px", 5, 53);
    debugCtx.fillText("Canvas width: " + mainCanvas.width + "px", 5, 67);
    debugCtx.fillText("Canvas height: " + mainCanvas.height + "px", 5, 83);
  }
}

function getNewPiecePath(_pieceTabs, _pieceCanvasX, _pieceCanvasY, _tabSize) {
  // Draw tabs based on the piece.tabs object
  const cornerRadius = pieceSize / 10; // You can adjust this value

  let piecePath = new Path2D();
  piecePath.moveTo(_pieceCanvasX, _pieceCanvasY);

  if (_pieceTabs.top !== null) {
    const tabLocalX = Math.max(
      Math.min(pieceSize * _pieceTabs.top.pos, pieceSize - _tabSize * 2),
      _tabSize
    );
    const tabX = _pieceCanvasX + tabLocalX;
    const tabY = _pieceCanvasY;

    if (_pieceTabs.top.isInset) {
      piecePath.lineTo(tabX, tabY);
      piecePath.arcTo(
        tabX,
        tabY + _tabSize,
        tabX + _tabSize,
        tabY + _tabSize,
        cornerRadius
      ); // Bottom left
      piecePath.arcTo(
        tabX + _tabSize,
        tabY + _tabSize,
        tabX + _tabSize,
        tabY,
        cornerRadius
      ); // Bottom right
      piecePath.lineTo(tabX + _tabSize, tabY);
    } else {
      piecePath.lineTo(tabX, tabY);
      piecePath.arcTo(
        tabX,
        tabY - _tabSize,
        tabX + _tabSize,
        tabY - _tabSize,
        cornerRadius
      ); // Top left
      piecePath.arcTo(
        tabX + _tabSize,
        tabY - _tabSize,
        tabX + _tabSize,
        tabY,
        cornerRadius
      ); // Top right
      piecePath.lineTo(tabX + _tabSize, tabY);
    }
  }
  piecePath.lineTo(_pieceCanvasX + pieceSize, _pieceCanvasY);

  if (_pieceTabs.right !== null) {
    const tabLocalY = Math.max(
      Math.min(pieceSize * _pieceTabs.right.pos, pieceSize - _tabSize * 2),
      _tabSize
    );

    const tabX = _pieceCanvasX + pieceSize;
    const tabY = _pieceCanvasY + tabLocalY;

    if (_pieceTabs.right.isInset) {
      piecePath.lineTo(_pieceCanvasX + pieceSize, tabY);
      piecePath.arcTo(
        tabX - _tabSize,
        tabY,
        tabX - _tabSize,
        tabY + _tabSize,
        cornerRadius
      ); // Top left
      piecePath.arcTo(
        tabX - _tabSize,
        tabY + _tabSize,
        tabX,
        tabY + _tabSize,
        cornerRadius
      ); // Bottom left
      piecePath.lineTo(_pieceCanvasX + pieceSize, tabY + _tabSize);
    } else {
      piecePath.lineTo(_pieceCanvasX + pieceSize, tabY);
      piecePath.arcTo(
        tabX + _tabSize,
        tabY,
        tabX + _tabSize,
        tabY + _tabSize,
        cornerRadius
      ); // Top left
      piecePath.arcTo(
        tabX + _tabSize,
        tabY + _tabSize,
        tabX,
        tabY + _tabSize,
        cornerRadius
      ); // Bottom left
      piecePath.lineTo(_pieceCanvasX + pieceSize, tabY + _tabSize);
    }
  }
  piecePath.lineTo(_pieceCanvasX + pieceSize, _pieceCanvasY + pieceSize);

  if (_pieceTabs.bottom !== null) {
    const tabLocalX = Math.max(
      Math.min(pieceSize * _pieceTabs.bottom.pos, pieceSize - _tabSize * 2),
      _tabSize
    );
    const tabX = _pieceCanvasX + tabLocalX;
    const tabY = _pieceCanvasY + pieceSize;

    if (_pieceTabs.bottom.isInset) {
      piecePath.lineTo(tabX + _tabSize, tabY);
      piecePath.arcTo(
        tabX + _tabSize,
        tabY - _tabSize,
        tabX,
        tabY - _tabSize,
        cornerRadius
      ); // Top right
      piecePath.arcTo(tabX, tabY - _tabSize, tabX, tabY, cornerRadius); // Top left
      piecePath.lineTo(tabX, tabY);
    } else {
      piecePath.lineTo(tabX + _tabSize, tabY);
      piecePath.arcTo(
        tabX + _tabSize,
        tabY + _tabSize,
        tabX,
        tabY + _tabSize,
        cornerRadius
      ); // Bottom right
      piecePath.arcTo(tabX, tabY + _tabSize, tabX, tabY, cornerRadius); // Bottom left
      piecePath.lineTo(tabX, tabY);
    }
  }
  piecePath.lineTo(_pieceCanvasX, _pieceCanvasY + pieceSize);

  if (_pieceTabs.left !== null) {
    const tabLocalY = Math.max(
      Math.min(pieceSize * _pieceTabs.left.pos, pieceSize - _tabSize * 2),
      _tabSize
    );

    const tabX = _pieceCanvasX;
    const tabY = _pieceCanvasY + tabLocalY;

    if (_pieceTabs.left.isInset) {
      piecePath.lineTo(tabX, tabY + _tabSize);
      piecePath.arcTo(
        tabX + _tabSize,
        tabY + _tabSize,
        tabX + _tabSize,
        tabY,
        cornerRadius
      ); // Top left
      piecePath.arcTo(tabX + _tabSize, tabY, tabX, tabY, cornerRadius); // Bottom left
      piecePath.lineTo(tabX, tabY);
    } else {
      piecePath.lineTo(tabX, tabY + _tabSize);
      piecePath.arcTo(
        tabX - _tabSize,
        tabY + _tabSize,
        tabX - _tabSize,
        tabY,
        cornerRadius
      ); // Top left
      piecePath.arcTo(tabX - _tabSize, tabY, tabX, tabY, cornerRadius); // Bottom left
      piecePath.lineTo(tabX, tabY);
    }
  }
  piecePath.lineTo(_pieceCanvasX, _pieceCanvasY);

  piecePath.closePath();

  return piecePath;
}
//#endregion

//#region BACKGROUND
function onBackgroundInput(_event) {
  // Create a regular expression to match classes that begin with 'bg--'
  const regex = /^bg--/;

  // Iterate over the classes and remove those that match the pattern
  mainCanvas.classList.forEach((_className) => {
    if (regex.test(_className)) {
      mainCanvas.classList.remove(_className);
    }
  });

  mainCanvas.classList.add("bg--" + _event.target.value);
}
//#endregion

//#region MOUSE INPUTS
function handleMouseDown(_event) {
  if (timerIntervalId == null) {
    return;
  }

  const mouseX =
    _event.clientX - mainCanvas.getBoundingClientRect().left + viewOffsetX;
  const mouseY =
    _event.clientY - mainCanvas.getBoundingClientRect().top + viewOffsetY;

  switch (_event.buttons) {
    case 1: // Left mouse button
      if (markMade && markHovered) {
        onClickMark(mouseX, mouseY);
        break;
      } else if (markMade) {
        // Clicked outside mark
        removeMark();
      }

      if (hoveredPiece) {
        onClickPiece(mouseX, mouseY);
        break;
      }

      // Pressing on board
      startPanningView(_event.clientX, _event.clientY);

      break;
    case 2: // Right mouse button
      startCreateMark(mouseX, mouseY);
      break;
    case 4: // Scroll wheel button
      startPanningView(_event.clientX, _event.clientY);
      break;
  }

  setCursor(_event.target);
}

function handleMouseMove(_event) {
  if (timerIntervalId == null) {
    // Update previous mouse position
    prevMouseX = _event.clientX;
    prevMouseY = _event.clientY;
    setCursor(_event.target);

    return;
  }

  const mouseX =
    _event.clientX - mainCanvas.getBoundingClientRect().left + viewOffsetX;
  const mouseY =
    _event.clientY - mainCanvas.getBoundingClientRect().top + viewOffsetY;

  checkMouseHoverMark(mouseX, mouseY);
  checkMouseHoverPiece(mouseX, mouseY);

  if (!markMade && markStartX != null) {
    markEndX = mouseX;
    markEndY = mouseY;

    drawMark();
  } else if (markDragged) {
    moveMarkedPieces(mouseX, mouseY);
  } else if (selectedPiece) {
    moveSelectedPieceAndGroup(mouseX, mouseY);
  } else if (panningView || _event.buttons === 4 || panningViewLocked) {
    panView(_event.clientX, _event.clientY);
  }

  setCursor(_event.target);

  // Update previous mouse position
  prevMouseX = _event.clientX;
  prevMouseY = _event.clientY;
}

function handleMouseUp(_event) {
  if (timerIntervalId == null) {
    return;
  }

  switch (_event.button) {
    case 0: // Left mouse button
      markDragged = false;
      stopPanningView();

      if (selectedPiece) {
        dropSelectedPiece();
      }
      break;
    case 2: // Right mouse button
      if (markStartX != null && markEndX != null) {
        const mouseX =
          _event.clientX -
          mainCanvas.getBoundingClientRect().left +
          viewOffsetX;
        const mouseY =
          _event.clientY - mainCanvas.getBoundingClientRect().top + viewOffsetY;

        setMarking(mouseX, mouseY);
      }
      break;
    case 1: // Scroll wheel button
      stopPanningView();
      break;
  }

  setCursor(_event.target);
}

function handleMouseWheel(_event) {
  if (timerIntervalId == null) {
    return;
  }

  // Prevent the default behavior of the mouse wheel (e.g., page scrolling)
  _event.preventDefault();

  // Adjust zoom level based on the direction of the mouse wheel
  zoom(_event.deltaY > 0 ? -0.1 : 0.1);
}

// Add event listeners for mouse events
mainCanvas.addEventListener("mousedown", handleMouseDown);
document.addEventListener("mousemove", handleMouseMove);
document.addEventListener("mouseup", handleMouseUp);
// Add event listener for mouse wheel (for zooming)
mainCanvas.addEventListener("wheel", handleMouseWheel);

function setCursor(_target) {
  if (timerIntervalId == null) {
    // Game paused or completed
    document.body.style.cursor = "default";
  } else if (!markMade && markStartX != null) {
    // Making mark
    document.body.style.cursor = "pointer";
  } else if (markDragged || selectedPiece) {
    // Grabbing marked or selected pieces
    document.body.style.cursor = "grabbing";
  } else if (panningView || panningViewLocked) {
    // Panning view
    document.body.style.cursor = "all-scroll";
  } else if ((hoveredPiece || markHovered) && _target == mainCanvas) {
    // Hovering piece and/or mark
    document.body.style.cursor = "grab";
  } else {
    // Nothing special
    document.body.style.cursor = "default";
  }
}
//#endregion

//#region GENERATE PUZZLE
function openGenerateModal() {
  generateModal.showModal();
}
function closeGenerateModal() {
  generateModal.close();
}
generateModal.addEventListener("click", (_event) => {
  if (_event.target.nodeName !== "DIALOG") {
    return;
  }

  const rect = _event.target.getBoundingClientRect();

  if (
    rect.left > _event.clientX ||
    rect.right < _event.clientX ||
    rect.top > _event.clientY ||
    rect.bottom < _event.clientY
  ) {
    closeGenerateModal();
  }
});
openGenerateModal();

function generatePuzzle(_event) {
  _event.preventDefault();

  resetPuzzle();

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
    image = new Image();
    image.src = imageSrc;
    imageShow.src = imageSrc;

    // Wait for the image to load
    image.onload = function () {
      calculatePuzzleSize(image.width / image.height);

      setCanvasSize();

      sceneWidth = Math.round(mainCanvas.width * zoomLevel);
      sceneHeight = Math.round(mainCanvas.height * zoomLevel);
      // Start in center
      viewOffsetX = (sceneWidth - mainCanvas.width) / 2;
      viewOffsetY = (sceneHeight - mainCanvas.height) / 2;

      pieceSize = getNewPieceSize();

      createPieces();

      drawMainCanvas();
      drawSelectedPieces();
      drawMark();
      drawPanView();
      drawDebug();

      restartTimer();

      closeGenerateModal();
    };
  };
  reader.readAsDataURL(imageFile);
}

function resetPuzzle() {
  pieces.splice(0, pieces.length);
  piecesMatched.splice(0, piecesMatched.length);
  markedGroups.splice(0, markedGroups.length);
  selectedPiece = null;

  victoryMessage.classList.remove("active");
  isPuzzleDone = false;
  zoomLevel = 1;
  zoomInput.querySelector("span").textContent =
    Math.round(zoomLevel * 100) + "%";
  panningViewLocked = false;
  stopPanningView();
  document.getElementById("pan-input").checked = false;
  removeMark();
  imageShowContainer.style.display = "none";
  toggleShowImageLabel.innerText = "🖼🙈";
  document.getElementById("toggle-show-image").checked = false;
}

function calculatePuzzleSize(_aspectRatio) {
  const puzzleSizeValue = puzzleSizeInput.value;

  let puzzlePiecesAmount = 4;
  switch (puzzleSizeValue) {
    case "too-easy":
      puzzlePiecesAmount = 8;
      break;
    case "super-easy":
      puzzlePiecesAmount = 16;
      break;
    case "very-easy":
      puzzlePiecesAmount = 32;
      break;
    case "easy":
      puzzlePiecesAmount = 64;
      break;
    case "normal":
      puzzlePiecesAmount = 128;
      break;
    case "hard":
      puzzlePiecesAmount = 256;
      break;
    case "very-hard":
      puzzlePiecesAmount = 512;
      break;
    case "impossible":
      puzzlePiecesAmount = 1024;
      break;
  }

  // Find the number of rows and columns,
  //    with aspect ratio from image and
  //    total puzzle size of selection
  puzzleColumns = Math.round(Math.sqrt(puzzlePiecesAmount * _aspectRatio));
  puzzleRows = Math.round(puzzlePiecesAmount / puzzleColumns);

  // Set show image image aspect ratio to puzzle aspect ratio
  imageShowContainer.querySelector("img").style.aspectRatio =
    puzzleColumns / puzzleRows;

  piecesText.innerText = puzzleColumns * puzzleRows + " pieces";
}
//#endregion

//#region PUZZLE PIECE
function getNewPieceSize() {
  return Math.round(
    Math.min(
      sceneWidth / (1 + puzzleBoardPadding) / puzzleColumns,
      sceneHeight / (1 + puzzleBoardPadding) / puzzleRows
    )
  );
}

function createPieces() {
  pieces.splice(0, pieces.length);
  piecesMatched.splice(0, piecesMatched.length);
  markedGroups.splice(0, markedGroups.length);
  selectedPiece = null;

  for (let row = 0; row < puzzleRows; row++) {
    for (let col = 0; col < puzzleColumns; col++) {
      // Create puzzle piece objects with position and size information
      const piecesLoaded = pieces.length;

      let pieceTabs = {};
      // Left and top tab should be inverted from adjacent piece if any
      pieceTabs.left =
        col == 0
          ? null
          : {
              pos: pieces[piecesLoaded - 1].tabs.right.pos,
              isInset: !pieces[piecesLoaded - 1].tabs.right.isInset,
            };
      pieceTabs.top =
        row == 0
          ? null
          : {
              pos: pieces[piecesLoaded - puzzleColumns].tabs.bottom.pos,
              isInset:
                !pieces[piecesLoaded - puzzleColumns].tabs.bottom.isInset,
            };
      // Right and bottom tab should be randomized if not last
      pieceTabs.right =
        col == puzzleColumns - 1
          ? null
          : {
              pos: getRandomInt(tabSizeDecimal * 100) / (tabSizeDecimal * 100), // Random 0-1 float with 1 decimal
              isInset: getRandomBoolean(), // Random true or false
            };
      pieceTabs.bottom =
        row == puzzleRows - 1
          ? null
          : {
              pos: getRandomInt(tabSizeDecimal * 100) / (tabSizeDecimal * 100), // Random 0-1 float with 1 decimal
              isInset: getRandomBoolean(), // Random true or false
            };

      const piece = {
        id: row * puzzleColumns + col,
        correctCol: col,
        correctRow: row,
        x: getRandomInt(sceneWidth - pieceSize),
        y: getRandomInt(sceneHeight - pieceSize),
        offset: { x: 0, y: 0 }, // Offset from mouse click position to piece corner
        tabs: pieceTabs,
      };

      pieces.push(piece);
      piecesMatched.push([piece.id]);
    }
  }
}

function checkMouseHoverMark(_mouseX, _mouseY) {
  if (
    markMade &&
    _mouseX >= markStartX &&
    _mouseX <= markEndX &&
    _mouseY >= markStartY &&
    _mouseY <= markEndY
  ) {
    markHovered = true;
  } else {
    markHovered = false;
  }
}

function checkMouseHoverPiece(_mouseX, _mouseY) {
  // Check if mouse hovers any puzzle piece
  // Start backwards to check them in order, Top first
  for (let i = pieces.length - 1; i >= 0; i--) {
    const piece = pieces[i];
    if (
      _mouseX >= piece.x &&
      _mouseX <= piece.x + pieceSize &&
      _mouseY >= piece.y &&
      _mouseY <= piece.y + pieceSize
    ) {
      hoveredPiece = piece;
      return;
    }
  }

  hoveredPiece = null;
}

function onClickPiece(_mouseX, _mouseY) {
  selectedPiece = hoveredPiece;

  // Calculate the offset from the mouse click position to the piece corner
  selectedPiece.offset.x = _mouseX - selectedPiece.x;
  selectedPiece.offset.y = _mouseY - selectedPiece.y;

  // Bring the selected piece group to the top of the z-order
  // by moving the pieces in the group to end of array
  const selectedPieceGroupIndex = findIndexWithElement(
    piecesMatched,
    selectedPiece.id
  );
  piecesMatched[selectedPieceGroupIndex].forEach((_pieceId) => {
    movePieceToLast(_pieceId);
  });
  // Make sure selectedPiece is last
  movePieceToLast(selectedPiece.id);

  drawSelectedPieces();
  drawMainCanvas();
}

function moveMarkedPieces(_mouseX, _mouseY) {
  // Move marked group
  let x = _mouseX - markGrabOffsetX;
  let y = _mouseY - markGrabOffsetY;

  const markWidth = markEndX - markStartX;
  const markHeight = markEndY - markStartY;

  x = Math.min(Math.max(x, 0), sceneWidth - markWidth);
  y = Math.min(Math.max(y, 0), sceneHeight - markHeight);

  const xDifference = x - markStartX;
  const yDifference = y - markStartY;

  // Move mark
  markStartX = markStartX + xDifference;
  markStartY = markStartY + yDifference;
  markEndX = markEndX + xDifference;
  markEndY = markEndY + yDifference;

  // Move pieces in mark
  markedGroups.forEach((_markedGroup) => {
    _markedGroup.forEach((_pieceId) => {
      const _pieceIndex = pieces.findIndex((_piece) => _piece.id === _pieceId);

      pieces[_pieceIndex].y = pieces[_pieceIndex].y + yDifference;
      pieces[_pieceIndex].x = pieces[_pieceIndex].x + xDifference;
    });
  });

  drawMark();
  drawSelectedPieces();
}

function moveSelectedPieceAndGroup(_mouseX, _mouseY) {
  // Drag selected piece and its matched pieces
  let x = _mouseX - selectedPiece.offset.x;
  let y = _mouseY - selectedPiece.offset.y;

  x = Math.min(Math.max(x, 0), sceneWidth - pieceSize);
  y = Math.min(Math.max(y, 0), sceneHeight - pieceSize);

  const xDifference = x - selectedPiece.x;
  const yDifference = y - selectedPiece.y;

  if (Math.abs(xDifference) < 1 && Math.abs(yDifference) < 1) {
    // No difference in movement
    return;
  }

  const selectedPieceGroupIndex = findIndexWithElement(
    piecesMatched,
    selectedPiece.id
  );

  piecesMatched[selectedPieceGroupIndex].forEach((_pieceId) => {
    const _pieceIndex = pieces.findIndex((_piece) => _piece.id === _pieceId);

    pieces[_pieceIndex].x = pieces[_pieceIndex].x + xDifference;
    pieces[_pieceIndex].y = pieces[_pieceIndex].y + yDifference;
  });

  drawSelectedPieces();
}
function moveSelectedPieceAndGroupWithDistance(_distanceX, _distanceY) {
  // Drag selected piece and its matched pieces
  const selectedPieceGroupIndex = findIndexWithElement(
    piecesMatched,
    selectedPiece.id
  );

  piecesMatched[selectedPieceGroupIndex].forEach((_pieceId) => {
    const _pieceIndex = pieces.findIndex((_piece) => _piece.id === _pieceId);

    pieces[_pieceIndex].x = pieces[_pieceIndex].x + _distanceX;
    pieces[_pieceIndex].y = pieces[_pieceIndex].y + _distanceY;
  });

  drawSelectedPieces();
}

function dropSelectedPiece() {
  // Check if piece got dropped beside correct matching piece
  matchWithSurroundingPieces(selectedPiece);

  // Drop selected piece
  selectedPiece = null;

  checkIfPuzzleDone();

  drawSelectedPieces();
  drawMainCanvas();
}
//#endregion

//#region MARK MULTIPLE PIECES
function startCreateMark(_mouseX, _mouseY) {
  // Remove old marking
  removeMark();

  // Start marking pieces with box
  markStartX = _mouseX;
  markStartY = _mouseY;
  markEndX = _mouseX;
  markEndY = _mouseY;

  drawMark();
}

function setMarking(_mouseX, _mouseY) {
  // Set marking
  markDragged = false;

  markEndX = Math.max(markStartX, _mouseX);
  markStartX = Math.min(markStartX, _mouseX);
  markEndY = Math.max(markStartY, _mouseY);
  markStartY = Math.min(markStartY, _mouseY);

  // Get all pieces inside mark
  markedGroups.length = 0;
  let maxPieceX = null;
  let minPieceY = null;
  let minPieceX = null;
  let maxPieceY = null;
  for (let i = pieces.length - 1; i >= 0; i--) {
    const piece = pieces[i];

    if (
      piece.x + pieceSize > markStartX &&
      piece.x < markEndX &&
      piece.y + pieceSize > markStartY &&
      piece.y < markEndY
    ) {
      // Piece partly inside mark
      minPieceX = Math.min(minPieceX !== null ? minPieceX : piece.x, piece.x);
      maxPieceX = Math.max(
        maxPieceX !== null ? maxPieceX : piece.x,
        piece.x + pieceSize
      );
      minPieceY = Math.min(minPieceY !== null ? minPieceY : piece.y, piece.y);
      maxPieceY = Math.max(
        maxPieceY !== null ? maxPieceY : piece.y,
        piece.y + pieceSize
      );

      if (findIndexWithElement(markedGroups, piece.id) === -1) {
        // Piece group NOT already in markedGroups array
        const pieceGroupIndex = findIndexWithElement(piecesMatched, piece.id);
        markedGroups.push(piecesMatched[pieceGroupIndex]);
      }
    }
  }

  // Scale marking to edge of edge pieces, to just wrap all marked pieces
  markStartX = minPieceX;
  markEndX = maxPieceX;
  markStartY = minPieceY;
  markEndY = maxPieceY;

  // if markStartX == null then no piece was marked
  if (markStartX !== null) {
    markMade = true;
  }

  drawMark();
}

function onClickMark(_mouseX, _mouseY) {
  markDragged = true;
  markGrabOffsetX = _mouseX - markStartX;
  markGrabOffsetY = _mouseY - markStartY;

  // Move all pieces in mark to top of rest of pieces
  markedGroups.forEach((_markedGroup) => {
    _markedGroup.forEach((_pieceId) => {
      movePieceToLast(_pieceId);
    });
  });

  drawMark();
  drawSelectedPieces();
  drawMainCanvas();
}

function removeMark() {
  markMade = false;
  markDragged = false;
  markStartX = null;
  markStartY = null;
  markEndX = null;
  markEndY = null;
  markedGroups.length = 0;

  drawMark();
}
//#endregion

//#region PUZZLE MATCHING
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

function matchWithSurroundingPieces(_selectedPiece) {
  function getDelta2D(_adjacentPiece) {
    // Representing _selectedPiece correct col relative to _adjacentPiece correct col:
    // -1 : selectedPiece should be on left of adjacentPiece
    // 0  : selectedPiece should be on same col as adjacentPiece
    // 1  : selectedPiece should be on right of adjacentPiece
    const deltaCorrectCol =
      _selectedPiece.correctCol - _adjacentPiece.correctCol;
    const deltaCorrectRow =
      _selectedPiece.correctRow - _adjacentPiece.correctRow;

    const selectedPieceCorrectX =
      _adjacentPiece.x + deltaCorrectCol * pieceSize;
    const selectedPieceCorrectY =
      _adjacentPiece.y + deltaCorrectRow * pieceSize;

    // Distance between _selectedPiece pos and adjacent piece slot
    const deltaX = selectedPieceCorrectX - selectedPiece.x;
    const deltaY = selectedPieceCorrectY - selectedPiece.y;

    return { deltaX: deltaX, deltaY: deltaY };
  }

  function inMatchDistance(_deltaX, _deltaY) {
    const pieceMatchDistance = pieceMatchDistanceDecimal * pieceSize;
    if (
      _deltaX >= -pieceMatchDistance &&
      _deltaX <= pieceMatchDistance &&
      _deltaY >= -pieceMatchDistance &&
      _deltaY <= pieceMatchDistance
    ) {
      return true;
    }

    return false;
  }

  // Gets the pieces that should be on:
  //    posRelative : yPosRelative : xPosRelative
  //    (on top)    :      top     : center
  //    (on right)  :     center   : right
  //    (on bottom) :     bottom   : center
  //    (on left)   :     center   : left
  const correctAdjacentPieces = pieces.filter(
    (piece) =>
      (_selectedPiece.correctCol === piece.correctCol &&
        Math.abs(_selectedPiece.correctRow - piece.correctRow) === 1) ||
      (_selectedPiece.correctRow === piece.correctRow &&
        Math.abs(_selectedPiece.correctCol - piece.correctCol) === 1)
  );

  // Put adjecantPieces and selectedPiece in same array in piecesMatched
  correctAdjacentPieces.forEach((_adjacentPiece) => {
    // Check if the pieces are in matchable distance
    const delta2D = getDelta2D(_adjacentPiece);

    if (inMatchDistance(delta2D.deltaX, delta2D.deltaY)) {
      const adjacentPieceGroupIndex = findIndexWithElement(
        piecesMatched,
        _adjacentPiece.id
      );
      const selectedPieceGroupIndex = findIndexWithElement(
        piecesMatched,
        _selectedPiece.id
      );

      if (adjacentPieceGroupIndex == selectedPieceGroupIndex) {
        // Already in same group
        return;
      }

      // Snap pieces to position
      moveSelectedPieceAndGroupWithDistance(delta2D.deltaX, delta2D.deltaY);

      // Match pieces, merge their piecesMatched arrays
      piecesMatched[adjacentPieceGroupIndex] = piecesMatched[
        adjacentPieceGroupIndex
      ].concat(piecesMatched[selectedPieceGroupIndex]);
      piecesMatched.splice(selectedPieceGroupIndex, 1);

      playPopSound();
    }
  });
}
//#endregion

//#region PUZZLE COMPLETION
function checkIfPuzzleDone() {
  if (piecesMatched.length == 1) {
    completedPuzzle();
  }
}
function completedPuzzle() {
  isPuzzleDone = true;

  stopTimer();

  // Zoom out
  zoomLevel = 1;
  zoom(0);

  victoryMessage.classList.add("active");
  victoryTime.innerText = getFormatedTime(hours, minutes, seconds);

  playSuccessSound();
}
//#endregion

//#region CONTROLS INFO
function openControlsModal() {
  controlsModal.showModal();
}
function closeControlsModal() {
  controlsModal.close();
}
controlsModal.addEventListener("click", (_event) => {
  if (_event.target.nodeName !== "DIALOG") {
    return;
  }

  const rect = _event.target.getBoundingClientRect();

  if (
    rect.left > _event.clientX ||
    rect.right < _event.clientX ||
    rect.top > _event.clientY ||
    rect.bottom < _event.clientY
  ) {
    closeControlsModal();
  }
});
//#endregion

//#region ZOOM
function startAutoZoom(_zoomValue) {
  if (timerIntervalId == null && isPuzzleDone !== true) {
    return;
  }

  zoom(_zoomValue);

  currentZoomDelay = zoomStartDelay;
  autoZoom(_zoomValue);
}
function autoZoom(_zoomValue) {
  zoomIntervalId = setInterval(() => {
    zoom(_zoomValue);

    currentZoomDelay = Math.max(
      currentZoomDelay - (zoomStartDelay * 40) / currentZoomDelay,
      zoomMinDelay
    );

    // Start next autozoom interval with new zoomdelay
    clearInterval(zoomIntervalId);
    autoZoom(_zoomValue);
  }, currentZoomDelay);
}
function stopAutoZoom() {
  clearInterval(zoomIntervalId);
}

function zoom(_zoomValue) {
  zoomLevel += _zoomValue;

  // Ensure zoom level is within reasonable bounds
  zoomLevel = Math.max(1, Math.min(zoomLevel, maxZoomLevel));
  zoomLevel = Math.round(zoomLevel * 10) / 10;

  zoomChange();
}

function zoomChange() {
  const oldSceneWidth = sceneWidth;
  const oldSceneHeight = sceneHeight;

  sceneWidth = Math.round(mainCanvas.width * zoomLevel);
  sceneHeight = Math.round(mainCanvas.height * zoomLevel);

  const sceneWidthDelta = sceneWidth - oldSceneWidth;
  const sceneHeightDelta = sceneHeight - oldSceneHeight;

  const newViewOffsetX =
    viewOffsetX +
    ((prevMouseX - mainCanvas.getBoundingClientRect().left) /
      mainCanvas.width) *
      sceneWidthDelta;
  const newViewOffsetY =
    viewOffsetY +
    ((prevMouseY - mainCanvas.getBoundingClientRect().top) /
      mainCanvas.height) *
      sceneHeightDelta;

  viewOffsetX = Math.max(
    0,
    Math.min(sceneWidth - mainCanvas.width, newViewOffsetX)
  );
  viewOffsetY = Math.max(
    0,
    Math.min(sceneHeight - mainCanvas.height, newViewOffsetY)
  );

  // Make puzzle contain as much space as it can leaving the padding and
  // without stretching the pieces
  pieceSize = getNewPieceSize();

  const newScaleMultiplierX = sceneWidth / oldSceneWidth;
  const newScaleMultiplierY = sceneHeight / oldSceneHeight;

  pieces.forEach((piece) => {
    // let newX = piece.x * newScaleMultiplierX;
    // let newY = piece.y * newScaleMultiplierY;

    // newX = Math.min(Math.max(newX, 0), sceneWidth - pieceSize);
    // newY = Math.min(Math.max(newY, 0), sceneHeight - pieceSize);

    piece.x = piece.x * newScaleMultiplierX;
    piece.y = piece.y * newScaleMultiplierY;
  });

  // Update mark
  if (markStartX != null) {
    markStartX *= newScaleMultiplierX;
    markStartY *= newScaleMultiplierY;
    markEndX *= newScaleMultiplierX;
    markEndY *= newScaleMultiplierY;
  }

  drawMainCanvas();
  drawSelectedPieces();
  drawMark();
  drawDebug();

  // Set UI
  zoomInput.querySelector("span").textContent =
    Math.round(zoomLevel * 100) + "%";
}
//#endregion

//#region PAN VIEW
function setPanViewLock(_event) {
  panningViewLocked = _event.target.checked;

  drawPanView();
}
function startPanningView(_clientX, _clientY) {
  panningView = true;

  prevMouseX = _clientX;
  prevMouseY = _clientY;

  drawPanView();
}
function panView(_clientX, _clientY) {
  panningView = true;

  // Update view offsets based on mouse movement
  viewOffsetX -= _clientX - prevMouseX;
  viewOffsetY -= _clientY - prevMouseY;

  viewOffsetX = Math.max(
    0,
    Math.min(sceneWidth - mainCanvas.width, viewOffsetX)
  );
  viewOffsetY = Math.max(
    0,
    Math.min(sceneHeight - mainCanvas.height, viewOffsetY)
  );

  drawPanView();
  drawMainCanvas();
  drawSelectedPieces();
  drawMark();
}
function stopPanningView() {
  if (panningView === false) {
    return;
  }
  panningView = false;

  drawPanView();
}
//#endregion

//#region IMAGE
function toggleShowImage(_event) {
  if (_event.target.checked) {
    imageShowContainer.style.display = "block";
    toggleShowImageLabel.innerText = "🖼🙉";
  } else {
    imageShowContainer.style.display = "none";
    toggleShowImageLabel.innerText = "🖼🙈";
  }
}
//#endregion

//#region DEBUG
function setDebug(_event) {
  showDebug = _event.target.checked;

  drawDebug();
}
//#endregion

//#region GAME MUSIC
function setMusicOff(_event) {
  musicOff = _event.target.checked;

  if (musicOff) {
    musicInputWrapper.classList.add("off");
    stopMusic();
    return;
  }

  musicInputWrapper.classList.remove("off");
  if (isPuzzleDone === false && timerIntervalId != null) {
    playMusic();
  }
}

function playMusic() {
  if (musicOff || isPuzzleDone) {
    stopMusic();
    return;
  }

  gameMusicElement.play();
}
function stopMusic() {
  gameMusicElement.pause();
}
function restartMusic() {
  // Set the current time to 0 to restart from the beginning
  gameMusicElement.currentTime = 0;
}
//#endregion

//#region SOUND EFFECTS
function playPopSound() {
  popSoundElement.play();
}
function playSuccessSound() {
  successSoundElement.play();
}
//#endregion

//#region GAME TIMER
function getFormatedTime(_hours, _minutes, _seconds) {
  // Formats the time as hh:mm:ss
  return (
    String(_hours).padStart(2, "0") +
    ":" +
    String(_minutes).padStart(2, "0") +
    ":" +
    String(_seconds).padStart(2, "0")
  );
}

function startTimer() {
  if (isPuzzleDone || piecesMatched.length == 0) {
    return;
  }

  // Update the timer every second
  timerIntervalId = setInterval(updateTimer, 1000);

  pauseInput.checked = false;
  pauseInputLabel.innerText = "▶";

  playMusic();
  pausedMessage.classList.remove("active");
}
function updateTimer() {
  if (isPuzzleDone) {
    stopTimer();
    return;
  }

  seconds++;

  if (seconds === 60) {
    seconds = 0;
    minutes++;

    if (minutes === 60) {
      minutes = 0;
      hours++;
    }
  }

  timerText.innerText = getFormatedTime(hours, minutes, seconds);
}
function stopTimer() {
  clearInterval(timerIntervalId);
  timerIntervalId = null;

  stopMusic();
}
function restartTimer() {
  stopTimer();
  hours = 0;
  minutes = 0;
  seconds = 0;
  timerText.innerText = getFormatedTime(hours, minutes, seconds);

  restartMusic();

  startTimer();
}

function setPause(_event) {
  if (isPuzzleDone == null || isPuzzleDone || piecesMatched.length == 0) {
    _event.target.checked = false;
    pausedMessage.classList.remove("active");

    openGenerateModal();
    return;
  }

  if (_event.target.checked) {
    pauseInputLabel.innerText = "| |";
    pausedMessage.classList.add("active");
    stopTimer();
  } else {
    pauseInputLabel.innerText = "▶";
    pausedMessage.classList.remove("active");
    startTimer();
  }
}
//#endregion

//#region GENERAL FUNCTIONS
// function snapToGrid(_value) {
//   const gridSize = pieceSize / gridSnapSmoother;
//   return Math.round(Math.round(_value / gridSize) * gridSize);
// }

function findIndexWithElement(_arrays, _element) {
  for (let i = 0; i < _arrays.length; i++) {
    if (_arrays[i].includes(_element)) {
      return i;
    }
  }
  return -1; // Element not found in any array
}

function getRandomInt(_max) {
  return Math.floor(Math.random() * _max);
}

function getRandomBoolean() {
  return Math.random() < 0.5;
}
//#endregion

/*
END:    ‾‾‾‾‾ FUNCTIONS ‾‾‾‾‾‾
------------------------------
*/
