/***************************************************************
 Classes to support a bowling-scoring application and display results in a web page context.
 
 The methodology behind these classes starts with a sequential list of rolls as the operational data
 for a bowling game.  The operational data is maintained as a game progresses.  From this operational
 data are derived informational data, such as scoring frames, display frames, and utlimately HTML 
 representation for a web page context.
 
 Summary of classes:
 
    * Game class
        The Game class maintains the list of rolls for a bowling game and exposes
        methods for UI interaction and display in the context of a web page.

    * ScoringFrameList class
        The ScoringFrameList class takes a list of rolls upon construction and generates
        a list of scoring frames.  This class does the work to interpret the list of rolls
        to determine which rolls should get assigned as scoring components for specific frames,
        according to the scoring rules of bowling.
        
    * ScoringFrame class
        The ScoringFrame class associates up to three scores with a single sequential frame.  The class
        defines three scoring slots, to which rolls are assigned (via the ScoringFrameList class)
        
    * DisplayFrameList class
        The DisplayFrameList class takes a ScoringFrameList upon construction and generates a 
        corresponding list of display frames from the scoring frames.  
        
    * DisplayFrame class
        The DisplayFrame class does the work of interpreting a ScoringFrame and generating data
        to support its frame display.  The DisplayFrame contains three display slots; for "normal"
        bowling frames, only the first two will contain display instructions.  The last slot is used
        for the special last bowling frame.  The DisplayFrame contains the logic to interpret, for 
        example, that a 10 on a first roll in a scoring frame should be displayed as an "X" in the
        first slot, and a blank in the second slot (for "normal" frames... logic is different for the
        last frame).
        
    * HtmlDisplayFrameList class
        The HtmlDisplayFrameList takes a DisplayFrameList upon construction and generates an HTML
        string for output in a web page context.  The DisplayFrameList provides display instructions in each
        of three rolling slots and a main "running score" slot for all sequential frames of a game; 
        the HtmlDisplayFrameList processes these instructions to generate HTML output.

 ***************************************************************/


/********************************************************
  ScoringFrame class -- data structure for one scoring frame
    
    The constructor takes three rolls that form its score.  The rolls parameters
    are either integers or nulls.  A null values for a roll indicates the roll 
    hasn't happened yet.  The constructor also takes a boolean value indicating
    whether this frame should be treated as the last frame of a game, a
    "supporting score" -- the running score of the game as of immediately before this
    game -- and the total number of pins for the frame (i.e. the value of a strike).
    
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
    the scoring logic of bowling through associating rolls with scoring frames. 
 ********************************************************/
function ScoringFrameList(rolls, valueForStrike, numberOfFrames) {
    this.valueForStrike = valueForStrike;
    this.numberOfFrames = numberOfFrames;
    
    this.scoringFrames = new Array();    // our list for derived scoring frames            
    var rollIndex = 0;
    var rollCount = rolls.length;
    
    // go through the list of rolls...
    var sf;      // a new scoring frame we'll construct on each iteration in the loop
    while (rollIndex < rollCount) {                
        var roll = rolls[rollIndex];
        var rollNext = rollIndex + 1 < rollCount ? rolls[rollIndex + 1] : null;
        var rollThird = rollIndex + 2 < rollCount ? rolls[rollIndex + 2] : null;
        
        // compute the current running score based on the most recent frame added, if there is one                
        var supportingScore = this.scoringFrames.length > 0 ? this.scoringFrames[this.scoringFrames.length - 1].runningScore : 0;
        
        // is the next frame to be created going to be the last frame of the game?
        var isLastFrame = this.scoringFrames.length == numberOfFrames - 1;
        
        // we're at the beginning of a new frame with this roll... did we get a strike?
        if (roll != null && roll == valueForStrike) {
            // then create the frame with this and the next two rolls
            sf = new ScoringFrame(roll, rollNext, rollThird, isLastFrame, supportingScore, valueForStrike);
            
            if (isLastFrame)
                rollIndex = rollCount + 1;  // exit our loop here on the last frame
            else
                rollIndex++;   // if not the last frame, increment our roll index so the very next roll also starts its own frame                    
        }
        else if (roll != null && rollNext != null && roll + rollNext == valueForStrike) {
            // then create the frame with the spare and the next single roll
            sf = new ScoringFrame(roll, rollNext, rollThird, isLastFrame, supportingScore, valueForStrike);
            rollIndex += 2;   // skip so that the roll after the spare starts its own frame
        }
        else if (roll != null && rollNext != null && roll + rollNext < valueForStrike) {
            // if we didn't get a mark, but have two complete rolls then we can make the frame with them
            sf = new ScoringFrame(roll, rollNext, null, isLastFrame, supportingScore, valueForStrike);
            rollIndex += 2;   // skip after these two rolls                    
        }
        else {
            // otherwise, we have an incomplete frame with just this roll; create it
            // then skipping ahead should take us out of the roll loop
            sf = new ScoringFrame(roll, null, null, isLastFrame, supportingScore, valueForStrike);
            rollIndex += 1;
        }                
        
        // add the constructed scoring frame to our list
        this.scoringFrames.push(sf);
        
        // and as a final consideration... if our rolls list extends beyond the end of a game
        // based on the total number of frames this game should have, exit the loop if we've 
        // completed the last frame
        if (isLastFrame && sf.isComplete)
            rollIndex = rollCount + 1;
    }
    
    // property remainingPins : indicates how many pins may be knocked down by the next roll
    var mostRecent = this.scoringFrames.length == 0 ? null : this.scoringFrames[this.scoringFrames.length - 1];
    this.remainingPins = this.scoringFrames.length == 0 ? this.valueForStrike                           // we have no frames at all!  all pins available on the next roll
                       : this.scoringFrames.length == this.numberOfFrames && mostRecent.isComplete ? 0  // game has ended!
                       : mostRecent.isComplete ? this.valueForStrike                                    // more frames to roll, but we have a new starting frame
                       : mostRecent.remainingPins                                                       // otherwise we take our remaining pins from the most recent frame rolled
                       ;
                
    // method getFrames() : for retrieving the set of scoring frames in this list
    this.getFrames = function() {return this.scoringFrames; };
    
}


/********************************************************
  DisplayFrame class -- data structure with instrutions for how to display a frame
      
      Given a ScoringFrame object, the constructor interprets its scoring data 
      to determine how this frame should be displayed in a visual representation.
      This class implements the logic that says, for example, "if all 10 pins are knocked
      down in the first roll of this frame, display an "X" in the first slot and a blank
      in the second."      
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
    
    // use slightly different display logic whether this is the last frame;
    // slot1 is the same for either a normal frame or the last frame, 
    // but slots 2 and 3 use different logic depending on the type of frame
    
    this.slot1 = scoringFrame.isFirstRollStrike ? this.strikeDisplay
               : validRoll1 && scoringFrame.roll1 === 0 ? this.zeroDisplay      
               : validRoll1 ? scoringFrame.roll1.toString()  // otherwise display the 1-9 number
               : "";
               
    if (!scoringFrame.isLastFrame) {
        // normal frame; two output slots
        this.slot2 = scoringFrame.isFirstRollStrike ? ""                 // don't show the second supporting roll in the frame with a strike                           
                   : scoringFrame.isSecondRollSpare ? this.spareDisplay  // show the slash for the spare
                   : validRoll2 && scoringFrame.roll2 === 0 ? this.zeroDisplay // show the - for a zero
                   : validRoll2 ? scoringFrame.roll2.toString()          // show the number 0-9 rolled
                   : ""                                                  // we haven't rolled the second ball yet; keep it blank
                   ;
        this.slot3 = "";  // no display for slot 3 for a normal frmae
    }
    else{
        // for the last frame, we'll handle it a little differently
        this.slot2 = scoringFrame.isSecondRollStrike ? this.strikeDisplay // do show a strike with the second ball
                   : scoringFrame.isSecondRollSpare ? this.spareDisplay   // do show a two-ball spare
                   : validRoll2 && scoringFrame.roll2 === 0 ? this.zeroDisplay // show the - for a zero
                   : validRoll2 ? scoringFrame.roll2.toString()    // do show the second roll number even if we had an initial strike
                   : ""                                            // we haven't rolled this ball yet; keep it blank
                   ;
        this.slot3 = scoringFrame.isThirdRollStrike ? this.strikeDisplay  // do show a strike with the third ball
                   : scoringFrame.isThirdRollSpare ? this.spareDisplay    // do show a two-ball spare on the third ball
                   : validRoll3 && scoringFrame.roll3 === 0 ? this.zeroDisplay // show the - for a zero
                   : validRoll3 ? scoringFrame.roll3.toString()    // do show the third number
                   : ""                                            // we haven't rolled the third ball yet; keep it blank
                   ;                           
    }
    
        
    // the running score is displayed in the frame, depending on whether the scoring for the
    // frame is complete.  Otherwise, the running score is blank
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
  HtmlDisplayFrameList class -- an HTML representation of a DisplayFrameList object
  
      The constructor takes the display instructions from a DisplayFrameList and generates 
      an HTML representation of the complete list of frames.
 ********************************************************/
 function HtmlDisplayFrameList(displayFrameList) {
    this.displayFrameList = displayFrameList;
    var displayFrames = displayFrameList.getFrames();
    this.HTML = "";
    
    var blank = "&nbsp;";
    
    // process the display frames submitted into an HTML representation
    var tplFrame = "<div class='frame'>{0}</div>";
    var tplFrameNumber = "<div class='frameNumber'><span>{0}</span></div>"
    var tplSlot  = "<div class='slot'>{1}{0}</span></div>";
    var tplScore = "<div class='score'><span>{0}</span></div>"
    
    for (var i = 0; i < displayFrames.length; i++) {
        var df = displayFrames[i];
        var isLastFrame = (i == displayFrames.length - 1);
        
        var spanSlot1 = df.slot1 == df.strikeDisplay ? "<span class='strike'>" : "<span>";
        var spanSlot2 = df.slot2 == df.strikeDisplay ? "<span class='strike'>"
                      : df.slot2 == df.spareDisplay ? "<span class='spare'>"
                      : "<span>";
        var spanSlot3 = df.slot3 == df.strikeDisplay ? "<span class='strike'>"
                      : df.slot3 == df.spareDisplay ? "<span class='spare'>"
                      : "<span>";
                                              
        
        var fn = tplFrameNumber.replace("{0}", (i+1));                
        var slot1 = tplSlot.replace("{0}", df.slot1 == "" ? blank : df.slot1);
        var slot2 = tplSlot.replace("{0}", df.slot2 == "" ? blank : df.slot2);
        var slot3 = isLastFrame ? tplSlot.replace("{0}", df.slot3 == "" ? blank : df.slot3) : "";
        
        slot1 = slot1.replace("{1}", spanSlot1);
        slot2 = slot2.replace("{1}", spanSlot2);
        slot3 = slot3.replace("{1}", spanSlot3);
        
        var score = tplScore.replace("{0}", df.score == "" ? blank : df.score);
        
        var f = tplFrame.replace("{0}", fn + slot1 + slot2 + slot3 + score);
        this.HTML += f;
    }            
    
    // method:  getHTML():  get the HTML representation of the display frame list
    this.getHTML = function() { return this.HTML; };
    
    
    
 }


/********************************************************
  Game class -- conducts the scoring for a bowling game
  
      This class maintains operational data for conducting a bowling game
      such as the list of sequential rolls, and exposes methods that may be
      called from HTML page buttons to conduct rolls.  After each roll, 
      this class outputs the current state of the scorecard to a given
      output page element.  The class also outputs messages and its
      current list of rolls to specified page elements.
      
      Additional settings that define the number of pins in each frame
      (i.e. the value of a strike) and the number of frames in a game
      are supplied to the constructor; these default to 10 each if not
      supplied.  
      
      The pctToHitRemainingPins parameter is a means for adjusting the ability level 
      of random rolls.  This value should be a decimal value between 0 and 1 inclusive,
      and represents the percentage chance that the next random roll will hit all
      available pins.  A value of 1 will generate nothing but perfect (300) games.
      A value of 0 will ignore this initial ability check and only use a straight random
      choice of 0 to available pins for each random roll.  A value between 0 and 1
      will apply that percentage ability on an initial random roll; if that "hits", then
      all remaining pins (whether a strike or spare) are downed.  If that doesn't "hit", then
      a straight random value between 0 and available pins is used.
      
      The optional parameters strikeDisplay, spareDisplay, and zeroDisplay allow overriding
      the default "X", "/", and "-" characters respectively for display of those rolls.
      
 ********************************************************/
function Game(outputElement, messageElement, rollsLogElement
              , valueForStrike, numberOfFrames, pctToHitRemainingPins
              , strikeDisplay, spareDisplay, zeroDisplay
              )
{
    // remember settings passed in as constructor values
    this.outputElement = outputElement;                          // where our HTML display will go
    this.messageElement = messageElement;                        // where any processing messages or errors will go
    this.rollsLogElement = rollsLogElement;                      // for outputting the list of rolls
    
    this.valueForStrike = typeof(valueForStrike) !== 'undefined' ? valueForStrike : 10;  // default to 10 pins
    this.numberOfFrames = typeof(numberOfFrames) !== 'undefined' ? numberOfFrames : 10;  // default to 10 frames
    this.pctToHitRemainingPins = typeof(pctToHitRemainingPins) !== 'undefined' ? pctToHitRemainingPins : 0; // used for generating random rolls; default to completely random 0-10 rolls each time
    this.strikeDisplay = typeof(strikeDisplay) !== 'undefined' ? strikeDisplay : 'X';  // X for a strike
    this.spareDisplay  = typeof(spareDisplay)  !== 'undefined' ? spareDisplay  : '/';  // slash for a spare
    this.zeroDisplay   = typeof(zeroDisplay)   !== 'undefined' ? zeroDisplay   : '-';  // dash for a zero
    
    // additional data for processing a game
    this.rolls = new Array();                  // keep a sequential list of all rolls made in this game
    this.remainingPins = this.valueForStrike;  // initialize the number of pins that the next roll can hit

    // methods message(), error(), clearMessage():  display a message or error for feedback to user
    this.message = function(message) {
                       this.messageElement.innerHTML = "<span class='normal'>" + message + "</span>";
                   };

    this.error = function(message) {
                       this.messageElement.innerHTML = "<span class='error'>" + message + "</span>";
                   };
                   
    this.clearMessage = function() { this.message(""); };                          
                    
    // method refreshRollsLog():  update the Rolls log display element with the current list of rolls
    this.refreshRollsLog = function() {
        var html = "";
        for (var i = 0; i < this.rolls.length; i++) {
            var s = (i+1).toString().trim();
            var r = this.rolls[i].toString().trim();
            
            if (s.length == 1) s = "&nbsp;" + s;
            if (r.length == 1) r = "&nbsp;" + r;
            
            html += s + ": " + r + "<br />";
        }                
        this.rollsLogElement.innerHTML = html;
    };                        
                   
    // method processAndDisplay():  process the current state of rolls and display appropriate output
    this.processAndDisplay = function() {     
        var scoringFrames = new ScoringFrameList(this.rolls, this.valueForStrike, this.numberOfFrames);    // process the current set of rolls and assign to scoring frame slots
        this.remainingPins = scoringFrames.remainingPins;                                                  // the scoring frame list will let us know how many pins may be downed with the next roll           
        var displayFrames = new DisplayFrameList(scoringFrames, this.strikeDisplay, this.spareDisplay, this.zeroDisplay);  // derive a set of display frames from the scoring frames
        var htmlFrames = new HtmlDisplayFrameList(displayFrames);                                          // and further derive an HTML representation of those display frames for our web context

        // finally, replace the contents of the output element with the newly generated HTML representation
        this.outputElement.innerHTML = htmlFrames.getHTML();     
        
        // and refresh our running list of rolls      
        this.refreshRollsLog()
    };

    // method newGame():  clear the game data to start over
    this.newGame = function() {
        this.rolls = []; 
        this.processAndDisplay();
        this.message("Get ready to roll.");
    };
    
    // method addRoll():  given an integer value, determine if this is a valid
    //                    value to add as the next roll in sequence.  If it is,
    //                    add the roll and redisplay output.  If it isn't, 
    //                    throw an exception
    this.addRoll = function(rollValue) {
        try {
            // has the game ended?
            if (this.remainingPins == 0)
               throw "The game has ended.  No more rolls may be added";
           
            // is this a valid roll?
            var v = Number(rollValue);
            if (isNaN(v)) throw "The roll value must be a number."
            if (v <= this.remainingPins && v >= 0) {
                this.rolls.push(v);
                this.processAndDisplay();
                this.message("The last roll knocked down " + v.toString() + (v == 1 ? " pin." : " pins."));
            }
            else
                throw "The value must be between 0 and " + this.remainingPins + " for the next roll.";
        } catch (err) {
            this.error(err);
        }
      
    };
        
    
    
    // method addRandomRoll():  apply a random number of pins for the next roll
    this.addRandomRoll = function() {
        var rollValue = Math.random() < this.pctToHitRemainingPins ? this.remainingPins
                      : Math.floor(Math.random() * (this.remainingPins - 0 + 1)) + 0;    // get a random integer between 0 and remainingPins; yes, I know this formula as put uses "0" redundantly to maintain the "min to max" concept
        this.addRoll(rollValue);
    };
        
    
}

