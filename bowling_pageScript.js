/*******************************************************************
 page-level script to support the bowling.htm page;
 
 This is the scripting that establishes page-level variables and functions, 
 and wires up buttons to handlers.
 
 *******************************************************************/


// set up page-level variables that represent display containers or UI elements (e.g. buttons)
var outputElement = document.getElementById("scorecard");
var messageElement = document.getElementById("message");
var rollsLogElement = document.getElementById("rollsContent");
var rollValueElement = document.getElementById("rollValue");
var newGameButton = document.getElementById("newGame");
var addRollButton = document.getElementById("addRoll");
var randomRollButton = document.getElementById("randomRoll");
var randomFiveButton = document.getElementById("randomFive");
var completeGameButton = document.getElementById("completeGame");
var abilityRadioButtons = document.getElementsByName("ability");


// Create a page-level variable to hold our main GameWebUI object, which incorporates
// the core classes (e.g. Game) for interaction specifically in a web user interface context.  
// GameWebUI exposes methods that we'll connect to our UI buttons to conduct
// the scoring & output display for the bowling game.
// 
// The order of parameters is the following:
//
//     new GameWebUI(outputElement, messageElement, rollsLogElement
//                     , valueForStrike, numberOfFrames, pctToHitRemainingPins
//                     , strikeDisplay, spareDisplay, zeroDisplay
//                   );
// 
// Everything from "valueForStrike" on will be defaulted for what is expected of a normal bowling
// game, and therefore doesn't need to be supplied.  But we'll supply them here explicitly 
// to be instructive.

var theGame = new GameWebUI(outputElement, messageElement, rollsLogElement
                              , 10, 10, 0
                              , "X", "/", "-"
                            );


// use a page-level function to interpret the UI option choice among the "ability" radio buttons
function setRandomRollerAbility() {
    var radios = abilityRadioButtons;
    var value;
    for (var i = 0; i < radios.length; i++) {
        if (radios[i].type === 'radio' && radios[i].checked) {
            // get value, set checked flag or do whatever you need to
            value = radios[i].value;  
            
            // set the appropriate property in our page-level Game object      
            // to reflect the ability level chosen
            theGame.setPctToHitRemainingPins(Number(value));
        }
    }
}


// now wire up our UI buttons to the appropriate methods exposed by our Game object
newGameButton.onclick = function() {
    theGame.newGame();
};

addRollButton.onclick = function() {
    theGame.addRoll(rollValueElement.value);
};

randomRollButton.onclick = function() {
    setRandomRollerAbility();  // apply the ability level again in case it changed
    theGame.addRandomRoll();
};

randomFiveButton.onclick = function() {
    setRandomRollerAbility();  // apply the ability level again in case it changed
    for (var i = 0; i<5; i++)
        theGame.addRandomRoll();
};

completeGameButton.onclick = function() {
    
    if (theGame.isGameOver)
        theGame.error("The game is already complete.");
    else {
        setRandomRollerAbility();
        while (!theGame.isGameOver) {
            theGame.addRandomRoll();
        }
    }
};


// for display consistency, issue the Game's newGame() method to start our page interface
theGame.newGame();

