![Screenshot of the website.](/assets/images/puzzle2.png)

# 🧩 Puzzle Online
Upload an image and create your own puzzle in your desired size. Then put together the puzzle while being timed.

## 📦 Technologies:
 - `HTML`
 - `CSS`
 - `JavaScript`

## 👩🏽‍🍳 Features:
 - **Generate a puzzle** with desired amount of pieces and your own image.
 - **Grab single pieces** by pressing left mouse button, grabbed piece is marked with a shadow.
 - **Grab multiple pieces** by first marking them with right mouse button.
 - **Zoom** with mouse scroll or by using the zoom input in the navigation to see even the tiniest details.
 - **Pan/move around the puzzle** by pressing scroll button, grabbing empty board or by pressing `PAN🔒` in the navigation.
 - **See the current position on puzzle board** in the bottom left corner of the viewport while panning.
 - **See the image of the puzzle** by pressing the `🖼🙈` button in the navigation.
 - **Pause the game** to not ruin your time.
 - **Solve the puzzle** by connecting the pieces.
 - **Music and sound effects** is a must have 😃

## 🎮 Controls/Shortcuts:
Everything is controlled by the mouse and/or the navigation bar:
  ### Mouse
 - `Grab and move pieces` by pressing left mouse button.
 - `Mark multiple pieces` with right mouse button.
 - `Zoom` with mouse scroll.
 - `Pan/move around the puzzle` by pressing scroll button or grabbing empty board.
  ### Navigation bar
 - `Zoom` by clicking or pressing `+` and `-` in the zoom input. 
 - `Pan lock` by clicking the `PAN🔒` button. 
 - `Toggle image` by clicking the `🖼🙈` button. 
 - `Pause/Play` by clicking the `▶`/`| |` button. 

## 💭 Process:
I started by searching the internet for others that have made similar projects mainly to see how they had solved rendering the puzzle. My goal was to make it work using only pure HTML, CSS and JavaScript. Finally I came to the conclusion that a canvas element probably was the best way to go, because it gives me the freedom of rendering the puzzle the way I want to. Now I just had to figure out how to actually render stuff on the canvas element :D

To just draw the puzzle pieces on the canvas was not that hard. I just had to store all the pieces in an array, and in each piece I store it's current position and correct position. Whenever I make changes to the puzzle I run drawCanvas() to redraw everything that I want to display in proper Z-order. The order of the pieces in the array decides in what Z-order the pieces should be drawn because I loop through the pieces in order to draw each one individually.

...


## 📚 Learnings:
This far by working on this project I have advanced more in JavaScript and primarly I have learned how to use a HTML canvas element to draw shapes, text and shapes that are part of an image.

The hardest thing so far I think have been to draw things in the correct place and order when having a scene that can be zoomed and moved around inside and a browser window that can be scaled as well.

## ✨ Improvement/Todo:
- [ ] Choose amount of total pieces instead of x and y, then generate the puzzle in the aspect-ratio of the image.
- [ ] No need to draw pieces that are outside of canvas.
- [ ] Update GUI to display controls and timer nicer. 
- [ ] Change background and border of puzzle board/canvas to make it look nicer and easier to see difference between canvas and outside of canvas.
- [ ] Add user accounts and the ability to save generated puzzle on account.
- [ ] Add ability to save progress on puzzle on account.
- [ ] Store user puzzle time records and display it.
- [ ] Add ability to publish saved puzzle for other users to solve.
- [ ] Add highscore list to puzzles.

## 📸 Showcase:
![Screenshot of the website.](/assets/images/screenshot.jpg)
![Screenshot of the website.](/assets/images/puzzle-pan-lock.png)
![Screenshot of the website.](/assets/images/puzzle-show-image.png)
![Screenshot of the website.](/assets/images/puzzle-completed.png)

## 🚦 Running the Project:
To run the project just open the `index.html` file in your web browser, or go to [puzzle-online.netlify.app](https://puzzle-online.netlify.app/).

## ► Play on the live website!
The site is live on [puzzle-online.netlify.app](https://puzzle-online.netlify.app/).
