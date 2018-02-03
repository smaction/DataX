/***************************************************************
 Classes to support a bowling-scoring application.
 
 The methodology behind these classes starts with a sequential list of rolls as the operational data
 for a bowling game.  The operational data is maintained as a game progresses.  From these operational
 data are derived informational data, such as scoring frames and display frames.
 
 Summary of classes:
 
    * Game class
        The Game class maintains the operational data for a bowling game, primarily the 
        list of sequential rolls.  It exposes the method addRoll() for adding to this sequential list 
        as a game progresses, and the method processRolls() which returns a DisplayFrameList 
        that is derived from the list of rolls.  An external UI class would instantiate a Game()
        object, use addRoll() accordingly to conduct the game, and interpret the items in 
        the DisplayFrameList returned by processRolls() after each roll for its visual output.        

    * ScoringFrameList class
        The ScoringFrameList class takes a list of rolls upon construction and generates
        a list of scoring frames.  This class does the work to interpret the list of rolls,
        determining which rolls should get assigned as scoring components for which specific frames,
        according to the scoring rules of bowling.
        
    * ScoringFrame class
        The ScoringFrame class is a data structure that associates up to three roll values 
        with a single sequential frame.  The class defines three scoring slots, to which rolls 
        are assigned (via the ScoringFrameList class).
        
    * DisplayFrameList class
        The DisplayFrameList class takes a ScoringFrameList upon construction and generates a 
        corresponding list of display frames from the scoring frames.  
        
    * DisplayFrame class
        The DisplayFrame class does the work of interpreting an individual ScoringFrame, 
        generating data to support its display.  The DisplayFrame contains three display slots; 
        for "normal" bowling frames, only the first two will contain display instructions.  
        The last slot is used for the special last bowling frame.  The DisplayFrame class contains 
        the logic to interpret, for example, that a 10 on a first roll in a normal scoring frame should 
        be displayed as an "X" in the second (boxed) slot, and a blank in the first (non-boxed) slot.       
        For the last scoring frame, the logic dictates an "X" displayed in the first slot.        

 ***************************************************************/


/********************************************************
  ScoringFrame class -- data structure for one scoring frame
    
    The constructor takes three rolls that form its score.  The rolls parameters
    are either integers or nulls.  A null values for a roll indicates the roll 
    hasn't happened yet.  The constructor also takes a boolean value indicating
    whether this frame should be treated as the last frame of a game, a
    "supporting score" -- the running score of the game as of immediately before this
    frame -- and the total number of pins for the frame (i.e. the value of a strike).
    
 ********************************************************/
function ScoringFrame(roll1, roll2, roll3, isLastFrame, supportingScore, valueForStrike)
{
    this.isLastFrame = isLastFrame;              // is this the last frame in the game?
    this.supportingScore = supportingScore;      // the running score of the game prior to this frame                        
    this.valueForStrike = valueForStrike;        // the total number of pins that can be downed
    
    // use null to mean "this roll hasn't happened yet"
    // the typeof() operator will help us in the event a non-number (or undefined) value has been passed in
    // we'll conform those to null
    this.roll1 = typeof(roll1)=='number' ? roll1 : null;           
    this.roll2 = typeof(roll2)=='number' ? roll2 : null;
    this.roll3 = typeof(roll3)=='number' ? roll3 : null;

    // the current score for just this frame
    this.scoreForFrame = this.roll1 + this.roll2 + this.roll3;

    // the running score for the game, as of (the end) of this frame
    this.runningScore = this.supportingScore + this.scoreForFrame;
    
    // signal whether we have strikes or spares in this frame
    this.isFirstRollStrike = this.roll1 == valueForStrike;
    this.isSecondRollSpare = this.roll1 != null && !this.isFirstRollStrike && this.roll2 != null && this.roll1 + this.roll2 == valueForStrike;
    
    // situational items for the last frame
    this.isSecondRollStrike = this.isFirstRollStrike && this.roll2 == valueForStrike;
    this.isThirdRollSpare = this.isFirstRollStrike && this.roll2 != null && this.roll3 != null && !this.isSecondRollStrike && this.roll2 + this.roll3 == valueForStrike;
    this.isThirdRollStrike = this.roll3 == valueForStrike && !this.isThirdRollSpare;
    
    
    // is the scoring for this frame complete?  do we have all the rolls we need to score this frame?
    // the rules add additional consideration if we are in the last frame
    this.isComplete = this.isFirstRollStrike && this.roll2 != null && this.roll3 != null ? true
                    : this.isLastFrame && this.isSecondRollStrike && this.roll3 != null ? true
                    : this.isSecondRollSpare && this.roll3 != null ? true
                    : !this.isFirstRollStrike && !this.isSecondRollSpare && this.roll1 != null && this.roll2 != null ? true
                    : false;
                    
    // how many pins remain, assuming this is an incomplete frame?                            
    // different rules apply for the last frame
    this.remainingPins = this.isLastFrame && this.isComplete ? 0  // game has ended
                       : this.roll1 == null ? valueForStrike  // game is just beginning
                       : this.isLastFrame && this.isSecondRollStrike && roll3 == null ? valueForStrike
                       : this.isFirstRollStrike && roll2 == null ? valueForStrike
                       : this.isSecondRollSpare & roll3 == null ? valueForStrike
                       : this.isFirstRollStrike && roll3 == null ? valueForStrike - this.roll2
                       : valueForStrike - this.roll1   // otherwise, we've rolled one ball and some pin(s) remain
                       ;                           
    
}


/********************************************************
  ScoringFrameList class -- a sequential list of scoring frames
  
    Given a set of rolls and parameters for number of pins in a frame and frames in a game, 
    the constuctor generates a sequential set of scoring frames that associate each roll 
    as participating in one or more scoring frames.  This is the class that essentially implements
    the scoring logic of bowling through association of rolls to scoring frames. 
 ********************************************************/
function ScoringFrameList(rolls, valueForStrike, numberOfFrames) {
    this.valueForStrike = valueForStrike;
    this.numberOfFrames = numberOfFrames;
    
    this.scoringFrames = new Array();    // our list for derived scoring frames            
    var rollIndex = 0;
    var rollCount = rolls.length;
    
    // go through the list of rolls...
    var sf;      // represents a new scoring frame we'll construct on each iteration in the loop
    while (rollIndex < rollCount) {  
        // the start of an iteration assumes we'd be at the start of a frame;
        // the roll at this index should be valid, but there's no guarantee that the 
        // next two rolls will be (they may not have been rolled yet).  If either the next or 
        // the next after that rolls are invalid, indicate those as null values.
        var roll = rolls[rollIndex];
        var rollNext = rollIndex + 1 < rollCount ? rolls[rollIndex + 1] : null;
        var rollThird = rollIndex + 2 < rollCount ? rolls[rollIndex + 2] : null;
        
        // compute the current running score based on the most recent frame already added, if there is one 
        // this will be supplied to the next scoring frame as its "supporting score"               
        var supportingScore = this.scoringFrames.length > 0 ? this.scoringFrames[this.scoringFrames.length - 1].runningScore : 0;
        
        // is this next frame to be created going to be the last frame of the game?
        var isLastFrame = this.scoringFrames.length == numberOfFrames - 1;
        
        // since we're at the beginning of a new frame with this roll... did we get a strike?
        if (roll != null && roll == valueForStrike) {
            // yes... then create the frame with this and the next two rolls
            sf = new ScoringFrame(roll, rollNext, rollThird, isLastFrame, supportingScore, valueForStrike);
            
            if (isLastFrame)
                rollIndex = rollCount + 1;  // exit our loop here on the last frame
            else
                rollIndex++;   // if not the last frame, increment our roll index so the very next roll also starts its own frame                    
        }
        else if (roll != null && rollNext != null && roll + rollNext == valueForStrike) {
            // or was this frame a two-roll spare?
            // if yes, then create the frame with the spare and the next single roll
            sf = new ScoringFrame(roll, rollNext, rollThird, isLastFrame, supportingScore, valueForStrike);
            rollIndex += 2;   // skip so that the roll after the spare starts its own frame
        }
        else if (roll != null && rollNext != null && roll + rollNext < valueForStrike) {
            // if we didn't get a mark, but have two complete rolls then we can make the frame with them
            // (we don't care about the third roll in sequence, since it won't participate in scoring
            //  for this frame)
            sf = new ScoringFrame(roll, rollNext, null, isLastFrame, supportingScore, valueForStrike);
            rollIndex += 2;   // skip after these two rolls to start the next frame                   
        }
        else {
            // otherwise, we have an incomplete frame with just this roll; create it as incomplete.
            // Then skipping ahead (incrementing the rollIndex counter) 
            // should take us out of the roll loop
            sf = new ScoringFrame(roll, null, null, isLastFrame, supportingScore, valueForStrike);
            rollIndex += 1;
        }                
        
        // add the constructed scoring frame to our list
        this.scoringFrames.push(sf);
        
        // and as a final consideration... if our rolls list extends beyond the end of a game
        // based on the total number of frames this game should have, and if we've completed
        // the last frame, exit the loop (i.e. don't process any more rolls even if there are some)
        if (isLastFrame && sf.isComplete)
            rollIndex = rollCount + 1;
    }
    
    // property remainingPins : indicates how many pins may be knocked down by the next roll;
    // to determine this, the last frame created in the list is inspected.  If it is complete,
    // we may either have a full set of pins available (if we have more frames to bowl)
    // or zero (if we completed the last frame). If it is not complete, we'll determine 
    // how many are available from this most recent frame created in the list. 
    var noFramesYet = this.scoringFrames.length == 0;
    var inFinalFrame = this.scoringFrames.length == this.numberOfFrames;
    var mostRecent = noFramesYet ? null : this.scoringFrames[this.scoringFrames.length - 1];

    this.remainingPins = noFramesYet ? this.valueForStrike               // we have no frames at all!  all pins available on the next roll
                       : inFinalFrame && mostRecent.isComplete ? 0       // game has ended! no more pins to roll
                       : mostRecent.isComplete ? this.valueForStrike     // more frames to roll, but we have a new starting frame so all pins are available
                       : mostRecent.remainingPins                        // otherwise we take our remaining pins from the most recent frame rolled
                       ;
                
    // method getFrames() : for retrieving the set of scoring frames in this list
    this.getFrames = function() {return this.scoringFrames; };
    
}


/********************************************************
  DisplayFrame class -- data structure with instrutions for how to display a frame
      
      Given a ScoringFrame object, the constructor interprets its scoring data 
      to determine how this frame should be displayed in a visual representation.
      This class implements the logic that says, for example, "if all 10 pins are knocked
      down in the first roll of this frame, display an "X" in the second (box) slot and a blank
      in the first (non-box slot)."      
 ********************************************************/
function DisplayFrame(scoringFrame, strikeDisplay, spareDisplay, zeroDisplay) {
    // the scoring frame will have three slots for up to three rolls to be associated with
    // the frame.  The scoring frame will also indicate whether the frame is considered complete
    // or not, such that a main score can be displayed.  Derive a visual representation based on 
    // the rolls associated to the scoring frame

    this.scoringFrame = scoringFrame;
    
    // set defaults for any display characters not supplied through parameters
    this.strikeDisplay = typeof(strikeDisplay) !== 'undefined' ? strikeDisplay : 'X';  // X for a strike
    this.spareDisplay  = typeof(spareDisplay)  !== 'undefined' ? spareDisplay  : '/';  // slash for a spare
    this.zeroDisplay   = typeof(zeroDisplay)   !== 'undefined' ? zeroDisplay   : '-';  // dash for a zero
    
    // deterine which rolls in the scoring frame are valid
    var validRoll1 = typeof(scoringFrame.roll1) == 'number';
    var validRoll2 = typeof(scoringFrame.roll2) == 'number';
    var validRoll3 = typeof(scoringFrame.roll3) == 'number';           
    
    // use slightly different display logic whether this is a normal frame or the last frame;
    if (!scoringFrame.isLastFrame)
    {
        // if we're in a normal frame, slot 1 will be blank on a strike, or if not, the roll number
        this.slot1 = scoringFrame.isFirstRollStrike ? ""    // slot1 stays blank if we rolled a strike
                   : validRoll1 && scoringFrame.roll1 === 0 ? this.zeroDisplay // display a zero 
                   : validRoll1 ? scoringFrame.roll1.toString()  // otherwise display the 1-9 number
                   : "";
                   
        // slot 2 will have the mark if one exists (strike or spare), or the number rolled
        this.slot2 = scoringFrame.isFirstRollStrike ? this.strikeDisplay   // show the mark in the second slot
                   : scoringFrame.isSecondRollSpare ? this.spareDisplay    // show the mark in the second slot
                   : validRoll2 && scoringFrame.roll2 === 0 ? this.zeroDisplay // show the display character for a zero
                   : validRoll2 ? scoringFrame.roll2.toString()          // show the number 0-9 rolled
                   : ""                                                  // we haven't rolled the second ball yet; keep it blank
                   ;
                   
        this.slot3 = "";  // no display for slot 3 for a normal frmae                   
    }
    else 
    {
        // special for the last frame; we will display a first roll strike in the first slot
        this.slot1 = scoringFrame.isFirstRollStrike ? this.strikeDisplay         // show the mark
                   : validRoll1 && scoringFrame.roll1 === 0 ? this.zeroDisplay   // show the zero character
                   : validRoll1 ? scoringFrame.roll1.toString()  // otherwise display the 1-9 number
                   : "";
        this.slot2 = scoringFrame.isSecondRollStrike ? this.strikeDisplay // do show a strike with the second ball
                   : scoringFrame.isSecondRollSpare ? this.spareDisplay   // do show a two-ball spare
                   : validRoll2 && scoringFrame.roll2 === 0 ? this.zeroDisplay // show the - for a zero
                   : validRoll2 ? scoringFrame.roll2.toString()    // do show the second roll number even if we had an initial strike
                   : ""                                            // we haven't rolled this ball yet; keep it blank
                   ;
        this.slot3 = scoringFrame.isThirdRollStrike ? this.strikeDisplay  // do show a strike with the third ball
                   : scoringFrame.isThirdRollSpare ? this.spareDisplay    // do show a two-ball spare on the third ball
                   : validRoll3 && scoringFrame.roll3 === 0 ? this.zeroDisplay // show the display character for a zero
                   : validRoll3 ? scoringFrame.roll3.toString()    // do show the third number
                   : ""                                            // we haven't rolled the third ball yet; keep it blank
                   ;                                              
    }
    
        
    // the running score is displayed in the frame, depending on whether the scoring for the
    // frame is complete.  If not complete, the running score is blank
    this.score = !scoringFrame.isComplete ? "" : scoringFrame.runningScore.toString();
                                        
} 

/********************************************************
  DisplayFrameList class -- a sequential list of display frames
      Given a list of scoring frames, the constructor derives a list of display
      frames which provide the data for how each frame should be visually represented.
 ********************************************************/
function DisplayFrameList(scoringFramesList, strikeDisplay, spareDisplay, zeroDisplay) {
    this.scoringFramesList = scoringFramesList;
    this.displayFrames = new Array();
    
    // set defaults for any display characters not supplied through parameters
    this.strikeDisplay = typeof(strikeDisplay) !== 'undefined' ? strikeDisplay : 'X';  // X for a strike
    this.spareDisplay  = typeof(spareDisplay)  !== 'undefined' ? spareDisplay  : '/';  // slash for a spare
    this.zeroDisplay   = typeof(zeroDisplay)   !== 'undefined' ? zeroDisplay   : '-';  // dash for a zero
    
    
    var scoringFrames = scoringFramesList.getFrames();
    for (var i = 0; i < scoringFrames.length; i++) {
        var sf = scoringFrames[i];
        this.displayFrames.push(new DisplayFrame(sf, strikeDisplay, spareDisplay, zeroDisplay));
    }
    
    // if the number of scoring frames are fewer than the number of frames in the game,
    // fill in additional empty display frames for a complete scorecard
    for (var i = scoringFrames.length; i < scoringFramesList.numberOfFrames; i++)
    {
        var sf = new ScoringFrame(null, null, null, i==scoringFramesList.numberOfFrames - 1, 0, scoringFramesList.valueForStrike)
        this.displayFrames.push(new DisplayFrame(sf, strikeDisplay, spareDisplay, zeroDisplay));
    }
                
    // method getFrames():  return the array display frames generated by this list
    this.getFrames = function() { return this.displayFrames; };
    
}



/********************************************************
  Game class -- conducts the scoring for a bowling game
  
      This class maintains operational data for conducting a bowling game
      such as the list of sequential rolls, and exposes methods that may be
      called from a UI context to add rolls and update scorecard display.
      
      Additional settings that define the number of pins in each frame
      (i.e. the value of a strike) and the number of frames in a game
      are supplied to the constructor; these default to 10 each if not
      supplied.  
      
      The optional parameters strikeDisplay, spareDisplay, and zeroDisplay allow overriding
      the default "X", "/", and "-" characters respectively for display of those rolls.
      
 ********************************************************/
function Game(valueForStrike, numberOfFrames, strikeDisplay, spareDisplay, zeroDisplay) 
{
    // remember settings passed in as constructor values
    this.valueForStrike = typeof(valueForStrike) !== 'undefined' ? valueForStrike : 10;  // default to 10 pins
    this.numberOfFrames = typeof(numberOfFrames) !== 'undefined' ? numberOfFrames : 10;  // default to 10 frames
    this.strikeDisplay = typeof(strikeDisplay) !== 'undefined' ? strikeDisplay : 'X';  // X for a strike
    this.spareDisplay  = typeof(spareDisplay)  !== 'undefined' ? spareDisplay  : '/';  // slash for a spare
    this.zeroDisplay   = typeof(zeroDisplay)   !== 'undefined' ? zeroDisplay   : '-';  // dash for a zero
    
    // additional data for processing a game
    this.rolls = new Array();                  // keep a sequential list of all rolls made in this game
    this.remainingPins = this.valueForStrike;  // initialize the number of pins that the next roll can hit
    this.isGameOver = false;                   // initialize to the start of a game

    // method processRolls():  process the current state of rolls and return a DisplayFrameList for
    //                         UI's to display;
    this.processRolls = function() {     
        var scoringFrames = this.processRollsToScoringFrames();    // process the current set of rolls and assign to scoring frame slots
        var displayFrames = new DisplayFrameList(scoringFrames, this.strikeDisplay, this.spareDisplay, this.zeroDisplay);  // derive a set of display frames from the scoring frames
        return displayFrames;
    };
    
    // method processRollsToScoringFrames(): process the current state of rolls and return a ScoringFrameList;
    //                                       this is important to do after every roll to update the 
    //                                       remainingPins property.  This method is intended to be 
    //                                       used internally.  UI classes would call processRolls() instead
    //                                       and generate display frames.
    this.processRollsToScoringFrames = function() {
        // generate scoring frames for rolls, and update our remainingPins and isGameOver properties
        var scoringFrames = new ScoringFrameList(this.rolls, this.valueForStrike, this.numberOfFrames);    // process the current set of rolls and assign to scoring frame slots
        this.remainingPins = scoringFrames.remainingPins;                                                  // the scoring frame list will let us know how many pins may be downed with the next roll           
        this.isGameOver = this.remainingPins == 0;
        return scoringFrames;   // return the list of scoring frames derived from the rolls
    }

    
    // method newGame():  clear the game data to start over
    this.newGame = function() {
        this.rolls = []; 
        this.isGameOver = false;
        this.remainingPins = this.valueForStrike;
    };
    
    // method addRoll():  given an integer value, determine if this is a valid
    //                    value to add as the next roll in sequence.  If it is,
    //                    add the roll and redisplay output.  If it isn't, 
    //                    throw an exception.  Returns the value rolled as a typed number.
    this.addRoll = function(rollValue) {
        // has the game ended?
        if (this.remainingPins == 0)
           throw "The game has ended.  No more rolls may be added";
       
        // is this a valid roll?
        var v = Number(rollValue);
        if (isNaN(v)) throw "The roll value must be a number."
        if (v <= this.remainingPins && v >= 0) {
            this.rolls.push(v);  // add the roll
            
            // make an internal call to processRollsToScoringFrames() to update our remainingPins and isGameOver properties
            this.processRollsToScoringFrames();
            
            return v;  // return the rolled value as a typed number
        }
        else
            throw "The value must be between 0 and " + this.remainingPins + " for the next roll.";      
    };

    
}

