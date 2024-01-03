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

// in decimal percentage
const puzzleBoardPadding = 0.5;

let zoomLevel = 0.1; // 0.1-1 (0.1 is full view visbile)
let viewOffsetX = 0; // 0-x
let viewOffsetY = 0; // 0-y

let prevMouseX = 0;
let prevMouseY = 0;

let imageSrc = null;
let image = new Image();
let imageScale = 1;

function generatePuzzle(event) {
  event.preventDefault();

  // Clear puzzle
  pieces.splice(0, pieces.length);

  console.log("Generating puzzle...");

  if (imageInput.files.length <= 0) {
    console.log("No file selected");
    imageShow.src = "#";
    imageSrc = "#";
    return;
  }
  imageFile = imageInput.files[0];

  const reader = new FileReader();
  reader.onload = function (e) {
    imageSrc = e.target.result;
    imageShow.src = imageSrc;

    sceneWidth = canvas.width * (1 + puzzleBoardPadding);
    sceneHeight = canvas.height * (1 + puzzleBoardPadding);

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
      const pieceWidth = canvas.width / puzzleColumns;
      const pieceHeight = canvas.height / puzzleRows;

      for (let row = 0; row < puzzleRows; row++) {
        for (let col = 0; col < puzzleColumns; col++) {
          // Create puzzle piece objects with position and size information
          const piece = {
            correctCol: col,
            correctRow: row,
            x: getRandomInt(canvas.width - pieceWidth) + viewOffsetX,
            y: getRandomInt(canvas.height - pieceHeight) + viewOffsetY,
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
    };
  };
  reader.readAsDataURL(imageFile);
}

function drawPuzzlePieces() {
  // Sort pieces based on z-order before drawing
  pieces.sort((a, b) => a.zIndex - b.zIndex);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save(); // Save the current state of the context

  // Apply zoom transformation
  // ctx.scale(zoomLevel, zoomLevel);

  pieces.forEach((piece) => {
    // ctx.drawImage(image, piece.x, piece.y, piece.width, piece.height);
    // Draw only the corresponding part of the image for each puzzle piece
    ctx.drawImage(
      image,
      piece.correctCol * piece.width * (image.width / canvas.width),
      piece.correctRow * piece.height * (image.height / canvas.height),
      image.width / puzzleColumns,
      image.height / puzzleRows, // Source region (entire image)
      piece.x - viewOffsetX,
      piece.y - viewOffsetY,
      piece.width,
      piece.height // Destination region (scaled to fit the canvas)
    );
  });

  // ctx.restore(); // Restore the saved state (undo the zoom transformation)
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
    const globalMouseX = event.clientX - canvas.getBoundingClientRect().left;
    const globalMouseY = event.clientY - canvas.getBoundingClientRect().top;

    const mouseX = globalMouseX;
    const mouseY = globalMouseY;
    // const mouseY = globalMouseY / zoomLevel;

    let x = mouseX - selectedPiece.offset.x;
    let y = mouseY - selectedPiece.offset.y;

    // Make sure the element stays within the parent container
    // x = Math.min(Math.max(x, 0), canvas.width - selectedPiece.width);
    // y = Math.min(Math.max(y, 0), canvas.offsetHeight - selectedPiece.height);

    x += viewOffsetX;
    y += viewOffsetY;

    x = Math.min(Math.max(x, 0), sceneWidth - selectedPiece.width);
    y = Math.min(Math.max(y, 0), sceneHeight - selectedPiece.height);

    selectedPiece.x = x;
    selectedPiece.y = y;

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
  zoomLevel = Math.max(0.1, Math.min(1, zoomLevel));

  // Update view offsets based on zoom level
  // viewOffsetX *= zoomLevel;
  // viewOffsetY *= zoomLevel;

  // Draw the puzzle pieces with the updated zoom level
  drawPuzzlePieces();
}

const imageShowContainer = document.getElementById("image");
const imageShow = imageShowContainer.querySelector("img");
function toggleShowImage() {
  if (imageShowContainer.style.display == "none") {
    imageShowContainer.style.display = "block";
  } else {
    imageShowContainer.style.display = "none";
  }
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
