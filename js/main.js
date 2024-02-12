/*
------------------------------
BEGIN:  __ VARS DECLARATION __
*/

//#region VARS - CANVAS & SCENE
let sceneWidth;
let sceneHeight;

const puzzleBoardPadding = 0.5; // in decimal percentage

const canvas = document.getElementById("puzzleCanvas");
const ctx = canvas.getContext("2d");
const mainWrapperElement = document
  .querySelector("main")
  .querySelector(".wrapper");

let viewOffsetX = 0; // 0-x
let viewOffsetY = 0; // 0-y
//#endregion

//#region VARS - PUZZLE PIECES
let pieceSize;
const tabSizeDecimal = 0.2;

const pieces = [];
let piecesMatched = [];
let selectedPiece = null;
let hoveredPiece = null;

const puzzleColumnsInput = document.getElementById("puzzle-columns-input");
const puzzleRowsInput = document.getElementById("puzzle-rows-input");

let puzzleColumns = 0;
let puzzleRows = 0;
//#endregion

//#region VARS - GENERATE PUZZLE
const generateModal = document.getElementById("generate-modal");
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
let imageScale = 1;

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

let isPuzzleDone = false;
//#endregion

//#region VARS - GENERAL
let prevMouseX = 0;
let prevMouseY = 0;

const gridSnapSmoother = 10;
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
canvas.addEventListener("contextmenu", function (_event) {
  // Prevent the default right-click behavior
  _event.preventDefault();
});

function setCanvasSize() {
  canvas.width = mainWrapperElement.clientWidth;
  canvas.height = mainWrapperElement.clientHeight;

  ctx.font = "16px Arial";

  zoomChange();
}
setCanvasSize();
window.onresize = setCanvasSize;

function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  pieces.forEach((piece) => {
    // Draw only the corresponding part of the image for each puzzle piece
    const tabSize = pieceSize * tabSizeDecimal;

    const imageScaleMultiplierX = image.width / (pieceSize * puzzleColumns);
    const imageScaleMultiplierY = image.height / (pieceSize * puzzleRows);

    const pieceCorrectX = piece.correctCol * pieceSize;
    const pieceCorrectY = piece.correctRow * pieceSize;

    const pieceImageX = pieceCorrectX * imageScaleMultiplierX;
    const pieceImageY = pieceCorrectY * imageScaleMultiplierY;
    const pieceImageWidth = image.width / puzzleColumns;
    const pieceImageHeight = image.height / puzzleRows;

    const pieceCanvasX = piece.x - viewOffsetX;
    const pieceCanvasY = piece.y - viewOffsetY;

    // Draw tabs based on the piece.tabs object
    const cornerRadius = pieceSize / 10; // You can adjust this value

    ctx.save();

    let piecePath = new Path2D();
    piecePath.moveTo(pieceCanvasX, pieceCanvasY);

    if (piece.tabs.top !== null) {
      const tabLocalX = Math.max(
        Math.min(pieceSize * piece.tabs.top.pos, pieceSize - tabSize * 2),
        tabSize
      );
      const tabX = pieceCanvasX + tabLocalX;
      const tabY = pieceCanvasY;

      if (piece.tabs.top.isInset) {
        piecePath.lineTo(tabX, tabY);
        piecePath.arcTo(
          tabX,
          tabY + tabSize,
          tabX + tabSize,
          tabY + tabSize,
          cornerRadius
        ); // Bottom left
        piecePath.arcTo(
          tabX + tabSize,
          tabY + tabSize,
          tabX + tabSize,
          tabY,
          cornerRadius
        ); // Bottom right
        piecePath.lineTo(tabX + tabSize, tabY);
      } else {
        piecePath.lineTo(tabX, tabY);
        piecePath.arcTo(
          tabX,
          tabY - tabSize,
          tabX + tabSize,
          tabY - tabSize,
          cornerRadius
        ); // Top left
        piecePath.arcTo(
          tabX + tabSize,
          tabY - tabSize,
          tabX + tabSize,
          tabY,
          cornerRadius
        ); // Top right
        piecePath.lineTo(tabX + tabSize, tabY);
      }
    }
    piecePath.lineTo(pieceCanvasX + pieceSize, pieceCanvasY);

    if (piece.tabs.right !== null) {
      const tabLocalY = Math.max(
        Math.min(pieceSize * piece.tabs.right.pos, pieceSize - tabSize * 2),
        tabSize
      );

      const tabX = pieceCanvasX + pieceSize;
      const tabY = pieceCanvasY + tabLocalY;

      if (piece.tabs.right.isInset) {
        piecePath.lineTo(pieceCanvasX + pieceSize, tabY);
        piecePath.arcTo(
          tabX - tabSize,
          tabY,
          tabX - tabSize,
          tabY + tabSize,
          cornerRadius
        ); // Top left
        piecePath.arcTo(
          tabX - tabSize,
          tabY + tabSize,
          tabX,
          tabY + tabSize,
          cornerRadius
        ); // Bottom left
        piecePath.lineTo(pieceCanvasX + pieceSize, tabY + tabSize);
      } else {
        piecePath.lineTo(pieceCanvasX + pieceSize, tabY);
        piecePath.arcTo(
          tabX + tabSize,
          tabY,
          tabX + tabSize,
          tabY + tabSize,
          cornerRadius
        ); // Top left
        piecePath.arcTo(
          tabX + tabSize,
          tabY + tabSize,
          tabX,
          tabY + tabSize,
          cornerRadius
        ); // Bottom left
        piecePath.lineTo(pieceCanvasX + pieceSize, tabY + tabSize);
      }
    }
    piecePath.lineTo(pieceCanvasX + pieceSize, pieceCanvasY + pieceSize);

    if (piece.tabs.bottom !== null) {
      const tabLocalX = Math.max(
        Math.min(pieceSize * piece.tabs.bottom.pos, pieceSize - tabSize * 2),
        tabSize
      );
      const tabX = pieceCanvasX + tabLocalX;
      const tabY = pieceCanvasY + pieceSize;

      if (piece.tabs.bottom.isInset) {
        piecePath.lineTo(tabX + tabSize, tabY);
        piecePath.arcTo(
          tabX + tabSize,
          tabY - tabSize,
          tabX,
          tabY - tabSize,
          cornerRadius
        ); // Top right
        piecePath.arcTo(tabX, tabY - tabSize, tabX, tabY, cornerRadius); // Top left
        piecePath.lineTo(tabX, tabY);
      } else {
        piecePath.lineTo(tabX + tabSize, tabY);
        piecePath.arcTo(
          tabX + tabSize,
          tabY + tabSize,
          tabX,
          tabY + tabSize,
          cornerRadius
        ); // Bottom right
        piecePath.arcTo(tabX, tabY + tabSize, tabX, tabY, cornerRadius); // Bottom left
        piecePath.lineTo(tabX, tabY);
      }
    }
    piecePath.lineTo(pieceCanvasX, pieceCanvasY + pieceSize);

    if (piece.tabs.left !== null) {
      const tabLocalY = Math.max(
        Math.min(pieceSize * piece.tabs.left.pos, pieceSize - tabSize * 2),
        tabSize
      );

      const tabX = pieceCanvasX;
      const tabY = pieceCanvasY + tabLocalY;

      if (piece.tabs.left.isInset) {
        piecePath.lineTo(tabX, tabY + tabSize);
        piecePath.arcTo(
          tabX + tabSize,
          tabY + tabSize,
          tabX + tabSize,
          tabY,
          cornerRadius
        ); // Top left
        piecePath.arcTo(tabX + tabSize, tabY, tabX, tabY, cornerRadius); // Bottom left
        piecePath.lineTo(tabX, tabY);
      } else {
        piecePath.lineTo(tabX, tabY + tabSize);
        piecePath.arcTo(
          tabX - tabSize,
          tabY + tabSize,
          tabX - tabSize,
          tabY,
          cornerRadius
        ); // Top left
        piecePath.arcTo(tabX - tabSize, tabY, tabX, tabY, cornerRadius); // Bottom left
        piecePath.lineTo(tabX, tabY);
      }
    }
    piecePath.lineTo(pieceCanvasX, pieceCanvasY);

    piecePath.closePath();

    if (selectedPiece && piece.id == selectedPiece.id) {
      // Add shadow behind selected piece
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";

      // Apply the scale transformation to the context
      ctx.translate(pieceSize / 20, pieceSize / 20);

      // Fill scaled path with shadow color
      ctx.fill(piecePath);

      // Reset the transformation to avoid affecting future drawings
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    ctx.clip(piecePath);
    ctx.drawImage(
      image,
      pieceImageX - tabSize * imageScaleMultiplierX,
      pieceImageY - tabSize * imageScaleMultiplierY,
      pieceImageWidth * (1 + tabSizeDecimal * 2),
      pieceImageHeight * (1 + tabSizeDecimal * 2), // Source region (entire image)
      pieceCanvasX - tabSize,
      pieceCanvasY - tabSize,
      pieceSize + tabSize * 2,
      pieceSize + tabSize * 2 // Destination region (scaled to fit the canvas)
    );

    ctx.restore();
  });

  if (markStartX != null) {
    // Draw mark
    const panViewWidth = Math.abs(markStartX - markEndX);
    const panViewHeight = Math.abs(markStartY - markEndY);

    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    if (markDragged) {
      // Add shadow behind selected piece
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    }

    ctx.fillRect(
      Math.min(markStartX, markEndX) - viewOffsetX,
      Math.min(markStartY, markEndY) - viewOffsetY,
      panViewWidth,
      panViewHeight
    );

    // Set the stroke color to black
    ctx.strokeStyle = "black";
    // Draw outline
    ctx.strokeRect(
      Math.min(markStartX, markEndX) - viewOffsetX,
      Math.min(markStartY, markEndY) - viewOffsetY,
      panViewWidth,
      panViewHeight
    );
  }

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
//#endregion

//#region MOUSE INPUTS
function handleMouseDown(_event) {
  if (timerIntervalId == null) {
    return;
  }

  const mouseX =
    _event.clientX - canvas.getBoundingClientRect().left + viewOffsetX;
  const mouseY =
    _event.clientY - canvas.getBoundingClientRect().top + viewOffsetY;

  switch (_event.buttons) {
    case 1: // Left mouse button
      if (markMade && !markHovered) {
        // Clicked outside mark
        removeMark();
      }

      if (markMade && markHovered) {
        // Clicked inside mark
        markDragged = true;
        markGrabOffsetX = mouseX - markStartX;
        markGrabOffsetY = mouseY - markStartY;

        // Move all pieces in mark to top of rest of pieces
        markedGroups.forEach((_markedGroup) => {
          _markedGroup.forEach((_pieceId) => {
            movePieceToLast(_pieceId);
          });
        });
      } else if (hoveredPiece) {
        selectedPiece = hoveredPiece;

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
        // Make sure selectedPiece is last
        movePieceToLast(selectedPiece.id);
      } else {
        // Pressing on board
        startPanningView(_event.clientX, _event.clientY);
      }

      break;
    case 2: // Right mouse button
      // Remove old marking
      removeMark();

      // Start marking pieces with box
      markStartX = mouseX;
      markStartY = mouseY;
      markEndX = mouseX;
      markEndY = mouseY;
      break;
    case 4: // Scroll wheel button
      startPanningView(_event.clientX, _event.clientY);
      break;
  }

  setCursor();

  drawCanvas();
}

function handleMouseMove(_event) {
  if (timerIntervalId == null) {
    // Update previous mouse position
    prevMouseX = _event.clientX;
    prevMouseY = _event.clientY;
    setCursor();

    return;
  }

  let draw = false;

  const mouseX =
    _event.clientX - canvas.getBoundingClientRect().left + viewOffsetX;
  const mouseY =
    _event.clientY - canvas.getBoundingClientRect().top + viewOffsetY;

  // Check if mouse hovers mark
  if (
    markMade &&
    mouseX >= markStartX &&
    mouseX <= markEndX &&
    mouseY >= markStartY &&
    mouseY <= markEndY
  ) {
    markHovered = true;
  } else {
    markHovered = false;
  }

  // Check if mouse hovers any puzzle piece
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

  if (!markMade && markStartX != null) {
    markEndX = mouseX;
    markEndY = mouseY;
  } else if (markDragged) {
    // Move marked group
    let x = mouseX - markGrabOffsetX;
    let y = mouseY - markGrabOffsetY;

    const markWidth = markEndX - markStartX;
    const markHeight = markEndY - markStartY;

    x = Math.min(Math.max(x, 0), sceneWidth - markWidth);
    y = Math.min(Math.max(y, 0), sceneHeight - markHeight);

    const xDifference = snapToGrid(x - markStartX);
    const yDifference = snapToGrid(y - markStartY);

    // Move mark
    markStartX = snapToGrid(markStartX + xDifference);
    markStartY = snapToGrid(markStartY + yDifference);
    markEndX = snapToGrid(markEndX + xDifference);
    markEndY = snapToGrid(markEndY + yDifference);

    // Move pieces in mark
    markedGroups.forEach((_markedGroup) => {
      _markedGroup.forEach((_pieceId) => {
        const _pieceIndex = pieces.findIndex(
          (_piece) => _piece.id === _pieceId
        );

        pieces[_pieceIndex].y = snapToGrid(pieces[_pieceIndex].y + yDifference);
        pieces[_pieceIndex].x = snapToGrid(pieces[_pieceIndex].x + xDifference);
      });
    });

    draw = true;
  } else if (selectedPiece) {
    // Drag selected piece and its matched pieces
    let x = mouseX - selectedPiece.offset.x;
    let y = mouseY - selectedPiece.offset.y;

    x = Math.min(Math.max(x, 0), sceneWidth - pieceSize);
    y = Math.min(Math.max(y, 0), sceneHeight - pieceSize);

    const xDifference = x - selectedPiece.x;
    const yDifference = y - selectedPiece.y;

    const selectedPieceGroupIndex = findIndexWithElement(
      piecesMatched,
      selectedPiece.id
    );

    piecesMatched[selectedPieceGroupIndex].forEach((_pieceId) => {
      const _pieceIndex = pieces.findIndex((_piece) => _piece.id === _pieceId);

      pieces[_pieceIndex].x = snapToGrid(pieces[_pieceIndex].x + xDifference);
      pieces[_pieceIndex].y = snapToGrid(pieces[_pieceIndex].y + yDifference);
    });

    draw = true;
  } else if (panningView || _event.buttons === 4 || panningViewLocked) {
    panView(_event.clientX, _event.clientY);

    draw = true;
  }

  setCursor();

  if (draw || markStartX != null) {
    // Draw the puzzle pieces with the updated view offsets
    drawCanvas();
  }

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
        // Check if piece got dropped beside correct matching piece
        matchWithSurroundingPieces(selectedPiece);

        // Drop selected piece
        selectedPiece = null;

        checkIfPuzzleDone();
      }
      break;
    case 2: // Right mouse button
      if (markStartX != null && markEndX != null) {
        // Set marking
        markDragged = false;

        const mouseX =
          _event.clientX - canvas.getBoundingClientRect().left + viewOffsetX;
        const mouseY =
          _event.clientY - canvas.getBoundingClientRect().top + viewOffsetY;

        markEndX = Math.max(markStartX, mouseX);
        markStartX = Math.min(markStartX, mouseX);
        markEndY = Math.max(markStartY, mouseY);
        markStartY = Math.min(markStartY, mouseY);

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
            minPieceX = Math.min(
              minPieceX !== null ? minPieceX : piece.x,
              piece.x
            );
            maxPieceX = Math.max(
              maxPieceX !== null ? maxPieceX : piece.x,
              piece.x + pieceSize
            );
            minPieceY = Math.min(
              minPieceY !== null ? minPieceY : piece.y,
              piece.y
            );
            maxPieceY = Math.max(
              maxPieceY !== null ? maxPieceY : piece.y,
              piece.y + pieceSize
            );

            if (findIndexWithElement(markedGroups, piece.id) === -1) {
              // Piece group NOT already in markedGroups array
              const pieceGroupIndex = findIndexWithElement(
                piecesMatched,
                piece.id
              );
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
      }
      break;
    case 1: // Scroll wheel button
      stopPanningView();
      break;
  }

  setCursor();

  drawCanvas();
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

function setCursor() {
  if (timerIntervalId == null) {
    // Game paused
    const mouseX = prevMouseX - canvas.getBoundingClientRect().left;
    const mouseY = prevMouseY - canvas.getBoundingClientRect().top;

    if (
      mouseX >= 0 &&
      mouseX <= canvas.width &&
      mouseY >= 0 &&
      mouseY <= canvas.height
    ) {
      document.body.style.cursor = "not-allowed";
    } else {
      document.body.style.cursor = "default";
    }

    return;
  }

  if (!markMade && markStartX != null) {
    // Making mark
    document.body.style.cursor = "pointer";
  } else if (markDragged || selectedPiece) {
    document.body.style.cursor = "grabbing";
  } else if (panningView || panningViewLocked) {
    document.body.style.cursor = "all-scroll";
  } else if (hoveredPiece) {
    document.body.style.cursor = "grab";
  } else {
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

  // Clear puzzle
  pieces.splice(0, pieces.length);
  piecesMatched.splice(0, piecesMatched.length);
  victoryMessage.classList.remove("active");
  isPuzzleDone = false;

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
      setCanvasSize();

      puzzleColumns = parseInt(puzzleColumnsInput.value);
      puzzleRows = parseInt(puzzleRowsInput.value);

      // Reset settings
      zoomLevel = 1;
      zoomInput.querySelector("span").textContent =
        Math.round(zoomLevel * 100) + "%";
      stopPanningView();
      panningViewLocked = false;
      document.getElementById("pan-input").checked = false;
      imageShowContainer.style.display = "none";
      toggleShowImageLabel.innerText = "🖼🙈";
      document.getElementById("toggle-show-image").checked = false;

      sceneWidth = Math.round(canvas.width * zoomLevel);
      sceneHeight = Math.round(canvas.height * zoomLevel);

      // Start in center
      viewOffsetX = (sceneWidth - canvas.width) / 2;
      viewOffsetY = (sceneHeight - canvas.height) / 2;

      // Cut the image into 4 rows and 4 columns
      pieceSize = getNewPieceSize();

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
                  pos:
                    getRandomInt(tabSizeDecimal * 100) / (tabSizeDecimal * 100), // Random 0-1 float with 1 decimal
                  isInset: getRandomBoolean(), // Random true or false
                };
          pieceTabs.bottom =
            row == puzzleRows - 1
              ? null
              : {
                  pos:
                    getRandomInt(tabSizeDecimal * 100) / (tabSizeDecimal * 100), // Random 0-1 float with 1 decimal
                  isInset: getRandomBoolean(), // Random true or false
                };

          const piece = {
            id: row * puzzleColumns + col,
            correctCol: col,
            correctRow: row,
            x: snapToGrid(getRandomInt(sceneWidth - pieceSize)),
            y: snapToGrid(getRandomInt(sceneHeight - pieceSize)),
            offset: { x: 0, y: 0 }, // Offset from mouse click position to piece corner
            tabs: pieceTabs,
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
//#endregion

//#region MARK MULTIPLE PIECES
function removeMark() {
  markMade = false;
  markDragged = false;
  markStartX = null;
  markStartY = null;
  markEndX = null;
  markEndY = null;
  markedGroups.length = 0;
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
  const correctAdjacentPieces = pieces.filter(
    (piece) =>
      (_selectedPiece.correctCol === piece.correctCol &&
        Math.abs(_selectedPiece.correctRow - piece.correctRow) === 1) ||
      (_selectedPiece.correctRow === piece.correctRow &&
        Math.abs(_selectedPiece.correctCol - piece.correctCol) === 1)
  );

  // Put adjecantPieces and selectedPiece in same array in piecesMatched
  correctAdjacentPieces.forEach((_adjacentPiece) => {
    // Check if the pieces are in the same row or column
    const sameRow = _selectedPiece.correctRow === _adjacentPiece.correctRow;
    const sameCol = _selectedPiece.correctCol === _adjacentPiece.correctCol;

    if (
      (sameRow &&
        _selectedPiece.correctCol - _adjacentPiece.correctCol ===
          (_selectedPiece.x - _adjacentPiece.x) / pieceSize &&
        _selectedPiece.y == _adjacentPiece.y) ||
      (sameCol &&
        _selectedPiece.correctRow - _adjacentPiece.correctRow ===
          (_selectedPiece.y - _adjacentPiece.y) / pieceSize &&
        _selectedPiece.x == _adjacentPiece.x)
    ) {
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

      // Matched pieces
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

  victoryMessage.classList.add("active");
  victoryTime.innerText = getFormatedTime(hours, minutes, seconds);

  playSuccessSound();
}
//#endregion

//#region ZOOM
function startAutoZoom(_zoomValue) {
  if (timerIntervalId == null) {
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

  sceneWidth = Math.round(canvas.width * zoomLevel);
  sceneHeight = Math.round(canvas.height * zoomLevel);

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
    let newX = piece.x * newScaleMultiplier;
    let newY = piece.y * newScaleMultiplier;

    newX = Math.min(Math.max(newX, 0), sceneWidth - pieceSize);
    newY = Math.min(Math.max(newY, 0), sceneHeight - pieceSize);

    newX = snapToGrid(newX);
    newY = snapToGrid(newY);

    piece.x = newX;
    piece.y = newY;
  });

  // Update mark
  if (markStartX != null) {
    markStartX *= newScaleMultiplier;
    markStartY *= newScaleMultiplier;
    markEndX *= newScaleMultiplier;
    markEndY *= newScaleMultiplier;
  }

  drawCanvas();

  // Set UI
  zoomInput.querySelector("span").textContent =
    Math.round(zoomLevel * 100) + "%";
}
//#endregion

//#region PAN VIEW
function setPanViewLock(_event) {
  panningViewLocked = _event.target.checked;

  drawCanvas();
}
function startPanningView(_clientX, _clientY) {
  panningView = true;

  prevMouseX = _clientX;
  prevMouseY = _clientY;
}
function panView(_clientX, _clientY) {
  panningView = true;

  // Update view offsets based on mouse movement
  viewOffsetX -= _clientX - prevMouseX;
  viewOffsetY -= _clientY - prevMouseY;

  viewOffsetX = Math.max(0, Math.min(sceneWidth - canvas.width, viewOffsetX));
  viewOffsetY = Math.max(0, Math.min(sceneHeight - canvas.height, viewOffsetY));
}
function stopPanningView() {
  panningView = false;
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

  drawCanvas();
}
//#endregion

//#region GAME MUSIC
function playMusic() {
  gameMusicElement.play();
}
function stopMusic() {
  gameMusicElement.pause();
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
  if (isPuzzleDone) {
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
  startTimer();
}

function setPause(_event) {
  if (isPuzzleDone) {
    _event.target.checked = false;
    pausedMessage.classList.remove("active");
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
function snapToGrid(_value) {
  const gridSize = pieceSize / gridSnapSmoother;
  return Math.round(Math.round(_value / gridSize) * gridSize);
}

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
