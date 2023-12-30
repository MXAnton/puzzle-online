const canvas = document.getElementById("puzzleCanvas");
const ctx = canvas.getContext("2d");
const pieces = [];

const imageInput = document.getElementById("image-input");
const widthInput = document.getElementById("width-input");
const heightInput = document.getElementById("height-input");

let imageSrc = null;
let width = 0;
let height = 0;

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

    width = parseInt(widthInput.value);
    height = parseInt(heightInput.value);

    // Load your image
    image = new Image();
    image.src = imageSrc;

    // Wait for the image to load
    image.onload = function () {
      // Cut the image into 4 rows and 4 columns
      const pieceWidth = canvas.width / width;
      const pieceHeight = canvas.height / height;

      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          // Create puzzle piece objects with position and size information
          const piece = {
            correctX: col * pieceWidth,
            correctY: row * pieceHeight,
            x: getRandomInt(canvas.width - pieceWidth),
            y: getRandomInt(canvas.height - pieceHeight),
            width: pieceWidth,
            height: pieceHeight,
            isDragging: false,
            offset: { x: 0, y: 0 }, // Offset from mouse click position to piece corner
            zIndex: pieces.length, // Assign z-order based on the order of creation
          };

          pieces.push(piece);
        }
      }

      // Draw the puzzle pieces on the canvas
      drawPuzzlePieces();

      // Add event listeners for mouse events
      canvas.addEventListener("mousedown", handleMouseDown);
      canvas.addEventListener("mousemove", handleMouseMove);
      canvas.addEventListener("mouseup", handleMouseUp);
    };
  };
  reader.readAsDataURL(imageFile);
}

function drawPuzzlePieces() {
  // Sort pieces based on z-order before drawing
  pieces.sort((a, b) => a.zIndex - b.zIndex);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  pieces.forEach((piece) => {
    // ctx.drawImage(image, piece.x, piece.y, piece.width, piece.height);
    // Draw only the corresponding part of the image for each puzzle piece
    ctx.drawImage(
      image,
      piece.correctX * (image.width / canvas.width),
      piece.correctY * (image.height / canvas.height),
      image.width / width,
      image.height / height, // Source region (entire image)
      piece.x,
      piece.y,
      piece.width,
      piece.height // Destination region (scaled to fit the canvas)
    );
  });
}

let selectedPiece = null;

function handleMouseDown(event) {
  const mouseX = event.clientX - canvas.getBoundingClientRect().left;
  const mouseY = event.clientY - canvas.getBoundingClientRect().top;

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
  if (selectedPiece && selectedPiece.isDragging) {
    let x =
      event.clientX -
      canvas.getBoundingClientRect().left -
      selectedPiece.offset.x;
    let y =
      event.clientY -
      canvas.getBoundingClientRect().top -
      selectedPiece.offset.y;

    // Make sure the element stays within the parent container
    x = Math.min(Math.max(x, 0), canvas.width - selectedPiece.width);
    y = Math.min(Math.max(y, 0), canvas.offsetHeight - selectedPiece.height);

    selectedPiece.x = x;
    selectedPiece.y = y;

    drawPuzzlePieces();
  }
}

function handleMouseUp() {
  if (selectedPiece) {
    selectedPiece.isDragging = false;
    selectedPiece = null;
  }
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
