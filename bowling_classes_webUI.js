/***************************************************************
 Classes to support a the web-page interaction and HTML display of a bowling Game.
 
 Summary of classes:
 
    * GameWebUI class
        The GameWebUI class maintains a Game object for conducting a game, and exposes
        methods for both UI interaction and visual display of scores.

    * HtmlDisplayFrameList class
        The HtmlDisplayFrameList takes a DisplayFrameList upon construction and generates an HTML
        string for output in a web page context.  The DisplayFrameList provides display instructions in each of three rolling slots and a main "running score" slot for all sequential frames of a game; 
        the HtmlDisplayFrameList processes these instructions to generate HTML output.
        
    * RandomRoller class
        The RandomRoller class applies an ability level to determine the number of pins knocked
        down with a random roll.

 ***************************************************************/



/********************************************************
  HtmlDisplayFrameList class -- an HTML representation of a DisplayFrameList object
  
      The constructor takes the display instructions from a DisplayFrameList and generates 
      an HTML representation of the complete list of frames.
      
      Specific classes are applied within tags in this representation:
          
          * individual frames are wrapped in a <div class='frame'> tag
          * the frame number is a nested <div class='frameNumber'> tag
          * scoring slots are nested <div> tags and have classes applied depending on the following:
          
                - if the slot is the first in a normal frame, it won't be boxed 
                    and displays with a "slot" class
                    
                - if the slot is the second in a normal frame, or any in the last frame,
                    it is boxed and displays with a "slotbox" class.
                    
                - if a slot displays a strike or spare, it adds the class "strike" 
                    or "spare" accordingly.
                    
                - scoring slots also wrap the display character in a <span> tag, also applying
                     a "strike" or "spare" class when appropriate.
                     
          * the running score is represented by <span> tag nested in a "<div class='score'>" tag.
          
      A CSS stylesheet should define stylings for these classes to resemble a visual scorecard.
          
 ********************************************************/
 function HtmlDisplayFrameList(displayFrameList) {
    this.displayFrameList = displayFrameList;
    var displayFrames = displayFrameList.getFrames();
    this.HTML = "";
    
    var blank = "&nbsp;";
    
    // process the display frames submitted into an HTML representation
    var tplFrame = "<div class='frame'>{0}</div>";
    var tplFrameNumber = "<div class='frameNumber'><span>{0}</span></div>"
    var tplSlot  = "<div class='slot{3}{2}'>{1}{0}</span></div>";
    var tplScore = "<div class='score'><span>{0}</span></div>"
    
    for (var i = 0; i < displayFrames.length; i++) {
        var df = displayFrames[i];
        var isLastFrame = (i == displayFrames.length - 1);
        
        var markClass1 = df.slot1 == df.strikeDisplay  ? "strike" : "";
        var markClass2 = df.slot2 == df.strikeDisplay ? "strike"
                       : df.slot2 == df.spareDisplay ? "spare"
                       : "";
        var markClass3 = df.slot3 == df.strikeDisplay ? "strike"
                       : df.slot3 == df.spareDisplay ? "spare"
                       : "";
                
        var spanSlot1 = markClass1 == "" ? "<span>" : "<span class='" + markClass1 + "'>";
        var spanSlot2 = markClass2 == "" ? "<span>" : "<span class='" + markClass2 + "'>";
        var spanSlot3 = markClass3 == "" ? "<span>" : "<span class='" + markClass3 + "'>";
        
        var fn = tplFrameNumber.replace("{0}", (i+1));                
        var slot1 = tplSlot.replace("{0}", df.slot1 == "" ? blank : df.slot1);
        var slot2 = tplSlot.replace("{0}", df.slot2 == "" ? blank : df.slot2);
        var slot3 = isLastFrame ? tplSlot.replace("{0}", df.slot3 == "" ? blank : df.slot3) : "";
        
        slot1 = slot1.replace("{1}", spanSlot1);
        slot2 = slot2.replace("{1}", spanSlot2);
        slot3 = slot3.replace("{1}", spanSlot3);
        
        slot1 = slot1.replace("{2}", markClass1 == "" ? "" : " " + markClass1 )
        slot2 = slot2.replace("{2}", markClass2 == "" ? "" : " " + markClass2 )
        slot3 = slot3.replace("{2}", markClass3 == "" ? "" : " " + markClass3 )
        
        slot1 = slot1.replace("{3}", isLastFrame ? "box" : ""); // class will just be "slot" for normal frames and "slotbox" for the last frame
        slot2 = slot2.replace("{3}", "box"); // class will be "slotbox"
        slot3 = slot3.replace("{3}", "box"); // class will be "slotbox"
        
        var score = tplScore.replace("{0}", df.score == "" ? blank : df.score);
        
        var f = tplFrame.replace("{0}", fn + slot1 + slot2 + slot3 + score);
        this.HTML += f;
    }            
    
    // method:  getHTML():  get the HTML representation of the display frame list
    this.getHTML = function() { return this.HTML; };
        
 }

/********************************************************
  RandomRoller class -- maintains an ability level for a pretend bowler 
                        and provides random rolls
                        
                        pctToHitRemainingPins is an indication of the ability level;
                          this should be a decimal value between 0 and 1 inclusive.
                          a value of 1 indicates the best bowler and will result in strikes
                          for every frame.  A value less than 1 indicates the percent chance
                          that the random bowler will knock down the remaining pins.  The higher
                          the value, the better the chance.  If an initial check against this
                          value succeeds, all remaining pins are knocked down.  If it fails,
                          then a second random pick is made between 0 and the total number of remaining
                          pins (inclusive) to see how many are actually knocked down.  This affords a
                          weak random bowler (pctToHitRemainingPins == 0) still a chance to get a
                          strike or spare.
 ********************************************************/ 
function RandomRoller(pctToHitRemainingPins)
{
    // property pctToHitRemainingPins: getter function
    this.getPctToHitRemainingPins = function() {
        return this.pctToHitRemainingPins
    }

    // property pctToHitRemainingPins: setter function
    this.setPctToHitRemainingPins = function(newValue) {
        if (typeof(newValue) != 'number')
            throw "The RandomRoller.pctToHitRemainingPins property must be a number.";

        if (newValue < 0 ||  newValue > 1)
            throw "The RandomRoller.pctToHitRemainingPins property must be a decimal number between 0 and 1 inclusive.";
            
        this.pctToHitRemainingPins = newValue;
    }
    
    // method roll():  execute a random roll between 0 and the given number of remaining pins
    //                 this takes into account the current property value pctToHitRemainingPins
    //                 which affords various ability levels.
    this.roll = function(remainingPins) {
        var hitAll = this.pctToHitRemainingPins == 1 ? true  // the best bowler ever gets the remaining pins every time
                   : this.pctToHitRemainingPins > 0 && Math.random() < this.pctToHitRemainingPins ? true  // lesser bowlers may still have a chance...
                   : false;

        if (hitAll)
            return remainingPins;
        else {
            var min = 0;
            var max = remainingPins;
            return Math.floor(Math.random()*(max-min+1)+min);       // formula for a random int between min and max inclusive
        }
    }

    // set our property values upon construction; indicate defaults if settings if not passed in
    this.pctToHitRemainingPins = 0;     // initial assignment
    var pctToHitValue = typeof(pctToHitRemainingPins) == 'undefined' ? 0 : pctToHitRemainingPins;  // if not supplied, assume 0
    this.setPctToHitRemainingPins(pctToHitValue);  // use our setter to establish the value so we can have type-checking
    
    this.valueForStrike = typeof(valueForStrike) == 'undefined' ? 10 : valueForStrike;    
    
}


/********************************************************
  GameWebUI class -- conducts a web-based user interface for the scoring for a bowling game
  
      This class maintains a Game object for conducting the scoring of a bowling game.
      it exposes methods that may be called from HTML page buttons to conduct rolls.  
      After each roll, this class outputs the current state of the Game scorecard to a given
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
function GameWebUI(outputElement, messageElement, rollsLogElement
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
    
    // the Game object that this UI wraps:
    this.Game = new Game(valueForStrike, numberOfFrames
                          , strikeDisplay, spareDisplay, zeroDisplay
                        );
                        
    // we'll also wrap a RandomRoller object for this UI:
    this.RandomRoller = new RandomRoller(pctToHitRemainingPins);                        
                        
    // initialize additional properties based on the wrapped Game object                        
    this.remainingPins = this.Game.remainingPins;   
    this.isGameOver    = this.Game.isGameOver;                      

    // methods message(), error(), clearMessage():  display a message or error for feedback to user
    this.message = function(message) {
                       if (this.messageElement)
                         this.messageElement.innerHTML = "<span class='normal'>" + message + "</span>";
                   };

    this.error = function(message) {
                       if (this.messageElement)
                         this.messageElement.innerHTML = "<span class='error'>" + message + "</span>";
                       else 
                         throw message;
                   };
                   
    this.clearMessage = function() { this.message(""); };                          
                    
    // method refreshRollsLog():  update the Rolls log display element with the current list of rolls
    this.refreshRollsLog = function() {
        if (this.rollsLogElement) {
            var html = "";
            for (var i = 0; i < this.Game.rolls.length; i++) {
                var s = (i+1).toString().trim();
                var r = this.Game.rolls[i].toString().trim();
                
                if (s.length == 1) s = "&nbsp;" + s;
                if (r.length == 1) r = "&nbsp;" + r;
                
                html += s + ": " + r + "<br />";
            }                
            this.rollsLogElement.innerHTML = html;
        }
    };                        
                   
    // method processAndDisplay():  process the current state of rolls and display appropriate output
    this.processAndDisplay = function() {     
        var displayFrames = this.Game.processRolls();
        this.remainingPins = this.Game.remainingPins;
        this.isGameOver = this.Game.isGameOver;
        var htmlFrames = new HtmlDisplayFrameList(displayFrames);                                          // and further derive an HTML representation of those display frames for our web context

        // replace the contents of the output element with the newly generated HTML representation
        if (this.outputElement) this.outputElement.innerHTML = htmlFrames.getHTML();     
        
        // and refresh our running list of rolls      
        this.refreshRollsLog()
    };

    // method newGame():  clear the game data to start over
    this.newGame = function() {
        this.Game.newGame();
        this.remainingPins = this.Game.remainingPins;
        this.isGameOver = this.Game.isGameOver;
        this.processAndDisplay();
        this.message("Get ready to roll");
    };
    
    // method addRoll():  pass the action to the underlying Game object, but
    //                    accept any exceptions it raises and display error messages
    //                    in our UI.
    this.addRoll = function(rollValue) {
        try {
            var v = this.Game.addRoll(rollValue);
            this.processAndDisplay();
            this.message("The last roll knocked down " + v + ((v == 1) ? " pin." : " pins."));
        } catch (err) {
            this.error(err);
        }
      
    };
        
    
    // For our UI, we'll also add some methods to support randomized rolls with various ability
    // levels.
    //
    // method addRandomRoll():  apply a random number of pins for the next roll
    this.addRandomRoll = function() {
        // determine the roll based on the random roller's current ability level
        var v = this.RandomRoller.roll(this.remainingPins);
        this.addRoll(v);
    };
    
    // method setPctToHitRemainingPins():  for random rolls, sets the ability of the roller from 0 to 1, with 0 being the weakest, and 1 being always a perfect game
    this.setPctToHitRemainingPins = function(newPct)        
    {
        try {
            this.RandomRoller.setPctToHitRemainingPins(newPct);            
        }
        catch (err) {
           this.error(err);
        }
    }
    
}

