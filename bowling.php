<?php

// found this solution at https://github.com/websiteduck/Bowling-Game
// the few modifications I made are noted by comment
error_reporting(E_ALL ^ E_NOTICE);
require 'bowlinggame.php';

$game = new BowlingGame();

while ($game->getFinished() === false) {
// no need to display until end of game    
/*    $game->displayScoreSheet();
    echo 'F:' . $game->getFrame();
    echo ' R:' . $game->getRoll();
    echo ' Pins: '; */
// want game to play automatically    
//    $pins = trim(fgets( STDIN ));
    $pins = rand(0,10);
    try {
        $game->roll($pins);
    }
    catch (Exception $e) {
        $game->resetFrame();
// no need to echo message just reset frame
//        echo '<< ' . $e->getMessage() . ' >>' . "\n\n";
    }
}

$game->displayScoreSheet();
echo 'Final Score: ' . $game->getScore() . "\n\n";