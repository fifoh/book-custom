// To do:
// - add buttons for instruments
// 

// Extras (optional?):
// - Allow note creation during playback? To more closesly align with other sketches

// clickable buttons for instruments
let debounceTimer;
let debounceTimerArray; 
let buttonSize = 20;
let ellipseButtons = [];
let ellipseColors = [
  [255,228,209],   // Red
  [203,237,209],   // Green
  [187,234,255]    // Blue
];

// sample sets
let loadedInstrumentSetBuffers = {};
let individualInstrumentArray = new Array(37).fill(1);

let initialBPM_value;

let addButton, removeButton;
let handcrankButton, handcrankOffButton;

let speedSliderPosition;
let speedSliderWidth;

let isPlaying;
let activeSources;
  
let rectX;
let rectY;
let rectWidth;
let rectHeight;
let cellWidth;
let cellHeight;
let mainRectPadding;  

let crankEnabled = false;
let checkbox;

let prevSliderValue = 0;

let rows = 10; // initial rows
const cols = 32; // columns ie note spaces (affects BPM if you change)

let grid = [];
let gridChanged = true; 

let pixelsPerMillisecond = 0;
let animate = false;
let animationStartTime = 0;

let playButton;
let stopButton;
let clearButton;
let speedSlider;

let noteDuration = 500;
let totalAnimationTime = 8000;
let columnDuration = totalAnimationTime / cols;

// Audio
// BufferLoader class to handle loading audio files
let audioBuffers = [];
let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let bufferLoader;

// BufferLoader class to handle loading audio files
function BufferLoader(context, urlList, callback) {
  this.context = context;
  this.urlList = urlList;
  this.onload = callback;
  this.bufferList = [];
  this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function(url, index) {
  let request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';

  let loader = this;

  request.onload = function() {
    loader.context.decodeAudioData(
      request.response,
      function(buffer) {
        if (!buffer) {
          console.error('Error decoding file data: ' + url);
          return;
        }
        loader.bufferList[index] = buffer;
        if (++loader.loadCount == loader.urlList.length) {
          loader.onload(loader.bufferList);
        }
      },
      function(error) {
        console.error('decodeAudioData error for ' + url, error);
      }
    );
  };

  request.onerror = function() {
    console.error('BufferLoader: XHR error for ' + url);
  };

  request.send();
};

BufferLoader.prototype.load = function() {
  for (let i = 0; i < this.urlList.length; ++i) {
    this.loadBuffer(this.urlList[i], i);
  }
};

function preload() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  loadAudioSet(individualInstrumentArray);
}

// Function to load audio set based on individualInstrumentArray
function loadAudioSet(individualInstrumentArray) {
  let filePathsToLoad = [];
  let bufferIndicesToLoad = [];

  for (let i = 0; i < 37; i++) {
    let setNumber = individualInstrumentArray[i];
    let instrumentSet = '';

    if (setNumber === 1) {
      instrumentSet = 'organ';
    } else if (setNumber === 2) {
      instrumentSet = 'cello';
    } else if (setNumber === 3) {
      instrumentSet = 'clarinet';
    } else {
      console.error(`Invalid set number ${setNumber} at index ${i}`);
      return;
    }

    let filePath = `${instrumentSet}/${i}.mp3`;
    filePathsToLoad.push(filePath);
    bufferIndicesToLoad.push(i);
  }

  if (filePathsToLoad.length > 0) {
    bufferLoader = new BufferLoader(
      audioContext,
      filePathsToLoad,
      (newBufferList) => finishedLoading(newBufferList, bufferIndicesToLoad)
    );
    bufferLoader.load();
  } else {
    // If no files need to be loaded, call finishedLoading with an empty array
    finishedLoading([], []);
  }
}

function finishedLoading(newBufferList, bufferIndicesToLoad) {
  for (let i = 0; i < newBufferList.length; i++) {
    let bufferIndex = bufferIndicesToLoad[i];
    audioBuffers[bufferIndex] = newBufferList[i];

    let setNumber = individualInstrumentArray[bufferIndex];
    let instrumentSet = '';
    if (setNumber === 1) {
      instrumentSet = 'organ';
    } else if (setNumber === 2) {
      instrumentSet = 'cello';
    } else if (setNumber === 3) {
      instrumentSet = 'clarinet';
    }

    let filePath = `${instrumentSet}/${bufferIndex}.mp3`;
    loadedInstrumentSetBuffers[filePath] = newBufferList[i];
  }

  // Remove entries from loadedInstrumentSetBuffers that were not loaded in this batch
  if (newBufferList.length > 0) {
    let filePathsLoaded = newBufferList.map((buffer, index) => {
      let bufferIndex = bufferIndicesToLoad[index];
      let setNumber = individualInstrumentArray[bufferIndex];
      let instrumentSet = '';
      if (setNumber === 1) {
        instrumentSet = 'organ';
      } else if (setNumber === 2) {
        instrumentSet = 'cello';
      } else if (setNumber === 3) {
        instrumentSet = 'clarinet';
      }
      return `${instrumentSet}/${bufferIndex}.mp3`;
    });

    for (let filePath in loadedInstrumentSetBuffers) {
      if (!filePathsLoaded.includes(filePath)) {
        delete loadedInstrumentSetBuffers[filePath];
      }
    }
  }
}

let majorPentatonic = {
  0: 0,
  1: 2,
  2: 4,
  3: 7,
  4: 9,
  5: 12,
  6: 14,
  7: 16,
  8: 19,
  9: 21,
  10: 24,
  11: 26,
  12: 28,
  13: 31,
  14: 33,
  15: 36
}

let minorPentatonic = {
  0: 0,
  1: 3,
  2: 5,
  3: 7,
  4: 10,
  5: 12,
  6: 15,
  7: 17,
  8: 19,
  9: 22,
  10: 24,
  11: 27,
  12: 29,
  13: 31,
  14: 34,
  15: 36
}

let ionian = {
  0: 0,
  1: 2,
  2: 4,
  3: 5,
  4: 7,
  5: 9,
  6: 11,
  7: 12,
  8: 14,
  9: 16,
  10: 17,
  11: 19,
  12: 21,
  13: 23,
  14: 24,
  15: 26
}

let dorian = {
  0: 0,
  1: 2,
  2: 3,
  3: 5,
  4: 7,
  5: 9,
  6: 10,
  7: 12,
  8: 14,
  9: 15,
  10: 17,
  11: 19,
  12: 21,
  13: 22,
  14: 24,
  15: 26
}

let mixolydian = {
  0: 0,
  1: 2,
  2: 4,
  3: 5,
  4: 7,
  5: 9,
  6: 10,
  7: 12,
  8: 14,
  9: 16,
  10: 17,
  11: 19,
  12: 21,
  13: 22,
  14: 24,
  15: 26
}

let aeolian = {
  0: 0,
  1: 2,
  2: 3,
  3: 5,
  4: 7,
  5: 8,
  6: 10,
  7: 12,
  8: 14,
  9: 15,
  10: 17,
  11: 19,
  12: 20,
  13: 22,
  14: 24,
  15: 26
}

let chromatic = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  11: 11,
  12: 12,
  13: 13,
  14: 14,
  15: 15
}

let harmonicMinor = {
  0: 0,
  1: 2,
  2: 3,
  3: 5,
  4: 7,
  5: 8,
  6: 11,
  7: 12,
  8: 14,
  9: 15,
  10: 17,
  11: 19,
  12: 20,
  13: 23,
  14: 24,
  15: 26
}

let wholeTone = {
  0: 0,
  1: 2,
  2: 4,
  3: 6,
  4: 8,
  5: 10,
  6: 12,
  7: 14,
  8: 16,
  9: 18,
  10: 20,
  11: 22,
  12: 24,
  13: 26,
  14: 28,
  15: 30
}

let octatonic = {
  0: 0,
  1: 1,
  2: 3,
  3: 4,
  4: 6,
  5: 7,
  6: 9,
  7: 10,
  8: 12,
  9: 13,
  10: 15,
  11: 16,
  12: 18,
  13: 19,
  14: 21,
  15: 22
}

// initial scale mapping (ie the default)
let scaleMappings = majorPentatonic;

let dragging = false;
let initialRow = -1;
let initialCol = -1;

// Touch functions for touch events
function touchStarted() {
  gridChanged = true;
  if (getAudioContext().state !== 'running') {
    getAudioContext().resume();
  }      
  if (!animate && touches.length > 0) {
    
    let touchX = touches[0].x;
    let touchY = touches[0].y;    
    
    let adjustedtouchX = touchX - rectX;
    let adjustedtouchY = touchY - rectY;       
    
    let touch = touches[0];
    
    let buttonClicked = false;
    
    for (let btn of ellipseButtons) {
      let d = dist(adjustedtouchX, adjustedtouchY, btn.x, btn.y);
      if (d < btn.size / 1.8) {
        updateIndividualInstrumentArray(btn.id);
        buttonClicked = true;
        gridChanged = true;
      }
    }          
    
    if (touch.x > rectX && touch.x < rectX + rectWidth && touch.y > rectY && touch.y < rectY + rectHeight) {
      let col = floor((touch.x - rectX) / cellWidth);
      let row = rows - 1 - floor((touch.y - rectY) / (cellHeight + 5));
      if (grid[row][col]) {
        deleteCells(row, col);
      } else {
        grid[row][col] = true;
        initialRow = row;
        initialCol = col;
        dragging = true;
      }
    }
  }
  gridChanged = true;
  return true;
}

function touchEnded() {
  dragging = false;
  initialRow = -1;
  initialCol = -1;
  gridChanged = true;
  return true; // To prevent default behavior
}

function touchMoved() {
  if (dragging && !animate && touches.length > 0) {
    let touch = touches[0];
    if (touch.x > rectX && touch.x < rectX + rectWidth && touch.y > rectY && touch.y < rectY + rectHeight) {
      let col = floor((touch.x - rectX) / cellWidth);
      let row = rows - 1 - floor((touch.y - rectY) / (cellHeight + 5));
      fillCells(initialRow, initialCol, col);
      gridChanged = true;
    }
  }
  return true; // To prevent default behavior
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  window.addEventListener('resize', resizeCanvasToWindow);
  frameRate(60);  
  
  rectX = 50;
  rectY = 100;
  rectWidth = windowWidth * 0.8;
  rectHeight = windowHeight * 0.7;
  
  isPlaying = Array(rows).fill(false);
  activeSources = Array(rows).fill(null);

  cellWidth = rectWidth / cols;
  cellHeight = (rectHeight - (rows - 1) * 5) / rows;

  mainRectPadding = 10;  
  
  graphics = createGraphics(windowWidth, windowHeight);
  graphics.stroke(0, 120);
  graphics.strokeWeight(2);
  graphics.strokeCap(PROJECT);
  
  // Draw the play line
  graphics.line(rectX - rectX * 0.15, rectY - rectY * 0.2, rectX - rectX * 0.15, rectHeight + rectHeight * 0.29);  
  
  initializeGridArray();
  
  playButton = createImg('images/play_icon.jpg', '▶');
  playButton.size(45, 45); 
  playButton.position(10, 20);
  playButton.touchStarted(() => toggleAnimation(totalAnimationTime));

  stopButton = createImg('images/stop_icon.jpg', '▶');
  stopButton.size(45, 45); 
  stopButton.position(10, 20);
  stopButton.touchStarted(stopAnimation).hide();

  clearButton = createImg('images/bin_icon.jpg', '✖');
  clearButton.size(45, 45);
  clearButton.touchStarted(clearGrid);
  clearButton.position(windowWidth - 50, 30);  
  
  // hand crank
  handcrankButton = createImg('images/handcrank_off.jpg', 'crank');
  handcrankButton.size(45, 45); 
  handcrankButton.position(10, 65);
  handcrankButton.touchStarted(toggleCrank);
  
  handcrankOffButton = createImg('images/handcrank_on.jpg', 'crank');
  handcrankOffButton.size(45, 45); 
  handcrankOffButton.position(10, 65);
  handcrankOffButton.touchStarted(toggleCrank);
  handcrankOffButton.hide(); // Hide initially
  
  // Add metro symbol
  metroImage = createImg('images/metro_icon.jpg', 'tempo');
  metroImage.size(45, 45);
  metroImage.position(65, 30);  
  
// instrument drop down and scales drop down
  // Scale dropdown
  scalesDropdown = createSelect();
  scalesDropdown.option('Select a Scale:', ''); // This will be the heading
  scalesDropdown.option('--- Pentatonic ---', 'disabled');
  scalesDropdown.option('Major');
  scalesDropdown.option('Minor');
  scalesDropdown.option('--- Modal ---', 'disabled');
  scalesDropdown.option('Ionian');
  scalesDropdown.option('Dorian');
  scalesDropdown.option('Mixolydian');
  scalesDropdown.option('Aeolian');
  scalesDropdown.option('--- Other ---', 'disabled');
  scalesDropdown.option('Chromatic');
  scalesDropdown.option('Harmonic Minor');
  scalesDropdown.option('Whole Tone');
  scalesDropdown.option('Octatonic');
  scalesDropdown.position(windowWidth/2, windowHeight - 25);
  scalesDropdown.changed(changeScale);
  
  // Instrument dropdown
  instrumentDropdown = createSelect();
  instrumentDropdown.option('Select an Instrument:', '');
  instrumentDropdown.option('organ');
  instrumentDropdown.option('cello');
  instrumentDropdown.option('clarinet');
  instrumentDropdown.position(10, windowHeight - 25);
  instrumentDropdown.changed(changeInstrument);  

  // Slider setup
  let sliderWrapper = select('.slider-wrapper');
  speedSlider = createSlider(40, 240, 100, 1); // Range from 1 to 10, default value 5
  speedSlider.position(65 + metroImage.width, 40);
  speedSliderPosition = 65 + metroImage.width;
  speedSlider.parent(sliderWrapper);
  speedSlider.style('width', '60px');
  speedSliderWidth = speedSlider.width;
  speedSlider.input(updateSpeed); // Update speed when slider value changes
  // Add touch event handling for the slider
  speedSlider.touchStarted(updateSpeed);
  speedSlider.touchMoved(updateSpeed);
  speedSlider.touchEnded(updateSpeed);
  
  updateSpeed();
  
  
  // Create add and remove buttons for ellipses
  addButton = createImg('images/add_row.jpg', '+');
  addButton.size(45, 45);
  addButton.position(windowWidth - 55 - addButton.width, 30);

  addButton.touchStarted(() => {
    if (rows < 15) {
      rows++;
      initializeGridArray();
      gridChanged = true;
    }
  });  

  removeButton = createImg('images/minus_row.jpg', '-');
  removeButton.size(45, 45);
  removeButton.position(windowWidth - 60 - removeButton.width - addButton.width, 30);

  removeButton.touchStarted(() => {
    if (rows > 5) {
      rows--;
      initializeGridArray();
      gridChanged = true;
    }
  });   
  
  // Bind touch events
  touchStarted = touchStarted;
  touchEnded = touchEnded;
  touchMoved = touchMoved;
}

function fillCells(row, col1, col2) {
  if (col1 > col2) [col1, col2] = [col2, col1]; // Swap if col1 is greater than col2
  for (let col = col1; col <= col2; col++) {
    grid[row][col] = true;
  }
}

function clearGrid() {
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < cols; j++) {
      grid[i][j] = false;
    }
  }
  gridChanged = true;
}

function deleteCells(row, col) {
  let left = col;
  while (left >= 0 && grid[row][left]) {
    grid[row][left] = false;
    left--;
  }

  let right = col + 1;
  while (right < cols && grid[row][right]) {
    grid[row][right] = false;
    right++;
  }
}

function draw() {
  if (gridChanged || animate || speedSlider.value() !== prevSliderValue) {
    clear();
    background(250);
    translate(rectX, rectY);

    fill(255);
    stroke(1, 20);
    rect(-mainRectPadding, -mainRectPadding, rectWidth + 2 * mainRectPadding, rectHeight + 2 * mainRectPadding);

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        noStroke();
        fill(grid[i][j] ? 0 : 255); // cell colour
        rect(j * cellWidth, (rows - 1 - i) * (cellHeight + 5), cellWidth, cellHeight);
      }
    }
    
    // draw the buttons
    for (let i = 0; i < rows; i++) {
      // draw the clickable instrument buttons
      let buttonSize = cellHeight * 0.5;
      let buttonX = -30;
      let buttonY = (rows - 1 - i) * (cellHeight + 5) + cellHeight / 2; // Center the button in the cell's Y-axis
      ellipseButtons.push({ id: i, x: buttonX, y: buttonY, size: buttonSize });
      // Adjust color index using scaleMappings
      let originalIndex = scaleMappings[i];
      let colIndex = individualInstrumentArray[originalIndex] - 1;

      fill(ellipseColors[colIndex]); // ellipse color
      strokeWeight(0);

      // Draw the button (a circle)
      ellipse(buttonX, buttonY, buttonSize, buttonSize);      
    }
                           
    

    // Draw vertical grid lines
    for (let j = 0; j <= cols; j++) {
      if (j % 8 === 0) {
        strokeWeight(2);
        stroke(0, 0, 0, 50); // thicker and more opaque
      } else if (j % 2 === 0) {
        strokeWeight(1);
        stroke(0, 0, 0, 35); // thinner and more transparent
      } else {
        continue;
      }
      line(j * cellWidth, 0, j * cellWidth, rectHeight);
    }

    translate(-rectX, -rectY);
    gridChanged = false;

    image(graphics, 0, 0);
    
    // BPM value
    noStroke();
    fill(0);
    text("♩ = " + speedSlider.value(), speedSliderPosition + speedSliderWidth * 1.2, 32);

    if (animate) {
      let elapsedTime = millis() - animationStartTime;
      let animationProgress = elapsedTime / totalAnimationTime;
      rectX = 50 - animationProgress * (rectWidth + mainRectPadding);

      let currentCol = floor(elapsedTime / columnDuration);
      playColumnSounds(currentCol);

      if (currentCol >= cols) stopAnimation();
      
      if (crankEnabled) {
        updateSpeedWithSineWave();
      }
    }
  }
  prevSliderValue = speedSlider.value();
}

function updateSpeed() {
  if (!animate) {
    initialBPM_value = speedSlider.value();
  }
  
  let BPM_value = speedSlider.value();

  // Calculate new total animation time based on the updated BPM
  let newTotalAnimationTime = ((60 / BPM_value) * 16) * 1000;

  if (animate) {
    // Calculate the current progress percentage
    let progress = (millis() - animationStartTime) / totalAnimationTime;

    // Update totalAnimationTime to the new value
    totalAnimationTime = newTotalAnimationTime;

    // Update pixelsPerMillisecond based on the new totalAnimationTime
    pixelsPerMillisecond = (rectX + rectWidth + mainRectPadding) / totalAnimationTime;

    // Calculate the new animationStartTime based on the current progress
    animationStartTime = millis() - (progress * totalAnimationTime);
  } else {
    // If animation is not running, simply update totalAnimationTime
    totalAnimationTime = newTotalAnimationTime;
  }

  // Recalculate column duration
  columnDuration = totalAnimationTime / cols;
}

function toggleAnimation() {
  animate = !animate;
  if (animate) {
    playButton.hide();
    stopButton.show();
    pixelsPerMillisecond = (rectX + rectWidth + mainRectPadding) / totalAnimationTime;
    animationStartTime = millis();
    columnDuration = totalAnimationTime / cols;
  } else {
    stopAnimation();
  }
}

function stopAnimation() {
  animate = false;
  stopButton.hide();
  playButton.show();
  rectX = 50;
  isPlaying.fill(false);
  activeSources.forEach(source => source && stopSoundWithFadeOut(source));
  activeSources.fill(null);
  gridChanged = true; // Set gridChanged to true to force a redraw
}

function playColumnSounds(col) {
  if (col < 0 || col >= cols) return;

  for (let row = 0; row < rows; row++) {
    if (grid[row][col]) {
      if (!isPlaying[row]) {
        playSound(row);
        isPlaying[row] = true;
      }
    } else {
      if (isPlaying[row]) {
        stopSound(row);
        isPlaying[row] = false;
      }
    }
  }
}

function playSound(row) {
  let bufferIndex = scaleMappings[row]; // Assuming the bufferIndex corresponds to the row
  playSoundFromBuffer(audioBuffers[bufferIndex], row);
}

function playSoundFromBuffer(buffer, row) {
  let source = audioContext.createBufferSource();
  source.buffer = buffer;
  let gainNode = audioContext.createGain();
  gainNode.gain.value = 0.3;
  source.connect(gainNode);
  gainNode.connect(audioContext.destination);
  source.start();
  activeSources[row] = { source: source, gainNode: gainNode };
}

function stopSound(row) {
  let activeSource = activeSources[row];
  if (activeSource) {
    stopSoundWithFadeOut(activeSource);
    activeSources[row] = null;
  }
}

function stopSoundWithFadeOut(activeSource) {
  let gainNode = activeSource.gainNode;
  gainNode.gain.setValueAtTime(gainNode.gain.value, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.025);
  activeSource.source.stop(audioContext.currentTime + 0.025);
}

function updateSpeedWithSineWave() {
  BPM_value = speedSlider.value();
  
  let elapsedTime = (millis() - animationStartTime); // change phase here
  // ie remove /2 for modulation twice as fast
  let sineValue = Math.sin((elapsedTime / totalAnimationTime) * TWO_PI * (cols / 8));
  let minBPM = initialBPM_value - 8; // adjust upper range here
  let maxBPM = initialBPM_value + 8; // and lower range here
  let bpmRange = (maxBPM - minBPM) / 2;
  let sineBPM = bpmRange * sineValue + (minBPM + bpmRange);
  speedSlider.value(sineBPM);
  updateSpeed();
}

function resizeCanvasToWindow() {
  resizeCanvas(windowWidth, windowHeight);
  // createEllipses(); REPLACE
  
  redraw();
}

function initializeGridArray() {
  // Create a new grid with the updated number of rows
  let newGrid = Array(rows).fill().map(() => Array(cols).fill(false));

  // Copy values from the old grid to the new grid
  for (let i = 0; i < Math.min(grid.length, rows); i++) {
    for (let j = 0; j < cols; j++) {
      newGrid[i][j] = grid[i][j];
    }
  }

  // Update the grid with the new grid
  grid = newGrid;

  // Update the cellHeight based on the new number of rows
  cellHeight = (rectHeight - (rows - 1) * 5) / rows;

  // Update isPlaying and activeSources arrays to match the new number of rows
  isPlaying = Array(rows).fill(false);
  activeSources = Array(rows).fill(null);

  // Mark the grid as changed to trigger a redraw
  gridChanged = true;
}

function enableCrank() {
  crankEnabled=true;
}

function disableCrank() {
  crankEnabled=false;
}

function toggleCrank() {
  crankEnabled = !crankEnabled; // Toggle the flag

  if (crankEnabled) {
    // Hand crank is enabled
    handcrankButton.hide();
    handcrankOffButton.show();
    // Call enableCrank function or perform actions when hand crank is enabled
    enableCrank();
  } else {
    // Hand crank is disabled
    handcrankButton.show();
    handcrankOffButton.hide();
    // Call disableCrank function or perform actions when hand crank is disabled
    disableCrank();
  }
}

function changeScale() {
  // Handle the change in scale selection here
  let selectedScale = scalesDropdown.value();
  if (selectedScale !== 'disabled') {
    // Process selected scale
    if (selectedScale === 'Major') {// pentatonic
      scaleMappings = majorPentatonic;
    } 
    if (selectedScale === 'Minor') {// pentatonic
      scaleMappings = minorPentatonic;
    }     
    if (selectedScale === 'Ionian') {
      scaleMappings = ionian;
    }
    if (selectedScale === 'Dorian') {
      scaleMappings = dorian;
    }
    if (selectedScale === 'Mixolydian') {
      scaleMappings = mixolydian;
    }
    if (selectedScale === 'Aeolian') {
      scaleMappings = aeolian;
    }
    if (selectedScale === 'Chromatic') {
      scaleMappings = chromatic;
    }
    if (selectedScale === 'Harmonic Minor') {
      scaleMappings = harmonicMinor;
    }    
    if (selectedScale === 'Whole Tone') {
      scaleMappings = wholeTone;
    }
    if (selectedScale === 'Octatonic') {
      scaleMappings = octatonic;
    }
  }
}

function changeInstrument() {
  // Initialise new sample set here
  let selectedInstrument = instrumentDropdown.value();
  if (selectedInstrument !== 'disabled') {
    // Process selected scale
    
    if (selectedInstrument === 'organ') {
      individualInstrumentArray = new Array(37).fill(1);
    }    
    
    if (selectedInstrument === 'cello') {
      individualInstrumentArray = new Array(37).fill(2);
    }
    if (selectedInstrument === 'clarinet') {
      individualInstrumentArray = new Array(37).fill(3);
    }
    console.log('Selected instrument:', selectedInstrument);
    
    loadAudioSet(individualInstrumentArray);
    gridChanged = true;
  }
}

function updateIndividualInstrumentArray(indexToUpdate) {
  // Clear previous debounce timer
  clearTimeout(debounceTimerArray);

  // Set a new debounce timer
  debounceTimerArray = setTimeout(() => {
    // Ensure indexToUpdate is within valid range
    if (indexToUpdate >= 0 && indexToUpdate < individualInstrumentArray.length) {
      
      // map the value according to scale dictionary
      indexToUpdate = scaleMappings[indexToUpdate];
      
      
      // Update the value at the specified indexToUpdate
      // Increment the value and constrain it to 1, 2, or 3
      individualInstrumentArray[indexToUpdate] = (individualInstrumentArray[indexToUpdate] % 3) + 1;
      
      // Reload audio set with updated individualInstrumentArray
      loadAudioSet(individualInstrumentArray);
      gridChanged = true;
    }
  }, 50); // Adjust debounce delay as needed (e.g., 50 milliseconds)
}