class Scene {
    constructor() {
        this.state = {
            hunger: {
                value:          5,    // INITIAL value
                max:            20,   // MAX value user can gain
                tickIncrement: -1/8,  // Every second (when the scene updates) decrease Food by 1/8
                button:         null, // Button will be added later onLoad()
            },
            cleanliness: {
                value:   5,
                max:     8,
                tickIncrement: -1/32,
                button:  null,
            },
            sleep: {
                value:   5,
                max:     8,
                tickIncrement: -1/16,
                button:  null,
            },
            play: {
                value:   5,
                max:     8,
                tickIncrement: -1/8,
                button:  null,
            },
            poop: {
                value:   5,
                max:     10,
                tickIncrement: 0,  // stat incremented only if food is non-zero
                button:  null,
            }
        };

        // Read this value from the CSS as the transition on `left`. We can't use `transionend` event
        // because we're using multiple transition durations on different CSS fields.
        this.walkTransitionDuration = 2000;

        this.feedDuration = 1000;
        this.poopDuration = 3000;
        this.sleepingDuration = 10000;
        this.bathDuration = 5000;

        // This is called before the DOM has loaded, so wouldn't be able to find elements by ID here.
    }

    onload() {
        // Wait to begin Oatchi logic until the Oatchi image and animations have loaded.
        // The DOM is also guaranteed to have been loaded by now.

        this.oatchi = document.getElementById("oatchi");
        this.pendingEvent = 0;
        // Referencing elements and setting them into the state's buttons
        this.state.hunger.button      = document.getElementById("food");
        this.state.cleanliness.button = document.getElementById("cleanliness");
        this.state.sleep.button       = document.getElementById("sleep");
        this.state.play.button        = document.getElementById("play");
        this.state.poop.button        = document.getElementById("poop");

        // Determine on a per-button basis which actions can override other actions.
        this.state.hunger.button.addEventListener("click", () => {
            if (this.isOatchiAvailable())
            {
                this.oatchiFeed();
            }
        });
        this.state.cleanliness.button.addEventListener("click", () => {
            if (this.isOatchiAvailable())
            {
                this.oatchiBath();
            }
        });
        this.state.sleep.button.addEventListener("click", () => {
            if (this.isOatchiAvailable())
            {
                this.oatchiSleep();
            }
        });
        this.state.poop.button.addEventListener("click", () => {
            if (this.isOatchiAvailable())
            {
                this.oatchiPoop();
            }
        });

        // Clicking Oatchi himself or the Play button has the same effect
        const playButtonHandler = () => {
            if (this.isOatchiAvailable())
            {
                this.oatchiPlay();
            }
        }
        this.state.play.button.addEventListener("click", playButtonHandler);
        this.oatchi.addEventListener("click", playButtonHandler);
        
        // For every stat above, attach click listeners and populate its text
        for (const statName in this.state){
            // Some stats won't have buttons associated with them (are hidden stats)
            const stat = this.state[statName];
            if (stat.button){
                Scene.updateButtonDisplay(stat);
            }
        }

        // Careful not to overwrite this.pendingEvent after this because oatchiGoIdle() assigns a value to it
        this.oatchiGoIdle();
    }

    onunload() {
        // Perform any cleanup or saving tasks here
    }

    //Instead of every action having its own setInterval(), they all share a single once a second update function
    updateScene() {
        // Rather than having separate interval events for each state, subtract a small amount from each state on every tickIncrement
        if (this.state.hunger.value > 0){
            this.state.poop.tickIncrement = -this.state.hunger.tickIncrement; // pooping is dependent on eating
        }
        else{
            // Can't poop if not fed
            this.state.poop.tickIncrement = 0;
        }

        for (const statName in this.state){
            const stat = this.state[statName];
            Scene.incrementStat(stat, stat.tickIncrement);

            // Some stats won't have buttons associated with them (are hidden stats)
            if (stat.button){
                Scene.updateButtonDisplay(stat);
            }
        }

        if (this.isOatchiAvailable()){
            // Oatchi is in his idle state. Don't wake up Oatchi for him to take a poop.
            // This also prevents mistakenly canceling and rescheduling events on every tickIncrement preventing them from ever running.
            if (this.state.poop.value == this.state.poop.max){
                this.oatchiPoop();
            }
        }
    }

    /// Oatchi is idle and ready for tasks if and only if he's pacing back and forth
    isOatchiAvailable() {
        return this.oatchi.classList.contains("walk-edge")
    }

    /// Adjust stat value but keep it between the min and max values
    static incrementStat(stat, byAmount) {
        stat.value = Math.min(Math.max(stat.value + byAmount, 0), stat.max);
        Scene.updateButtonDisplay(stat);
    }
    //updates stat text on the button
    static updateButtonDisplay(stat) {
        // Write a value between 0 and 1 into CSS for it to use for the linear gradient
        stat.button.style.setProperty('--progress', `${stat.value / stat.max}`);
    }

    static isOnLeft(element) {
        const style = window.getComputedStyle(element);
        const elementCenter = parseInt(style.left) + parseInt(style.width) / 2;
        return (elementCenter < (window.innerWidth / 2));
    }

    /**
     * If there is a pending transition (such as walking left when reaching right edge of screen)
     * then cancel that upcoming transition so both don't mistakenly play overlapped.
     */
    set_transition(nextTransition, timeout){
        if (this.pendingEvent)
        {
            // Prevent events from stacking on top of each other creating a glitchy mess
            clearTimeout(this.pendingEvent);
        }

        this.pendingEvent = setTimeout(() => {
            this.pendingEvent = 0;
            nextTransition();
        }, timeout);
    }

    /**
     * Walk back to center before playing action
     */
    oatchiWalkCenterThen(nextTransition) {
        this.oatchi.src = "./Oatchi-walk.gif"
        this.oatchi.classList.remove("walk-edge", "jump");
        this.oatchi.classList.toggle("face-right", Scene.isOnLeft(this.oatchi));
        
        this.set_transition(nextTransition, 1000);
    }
    /*Make Oatchi jump when clicked */
    oatchiPlay() {
        Scene.incrementStat(this.state.play, 1);
        
        this.oatchi.src = "Oatchi-play.gif";

        // Preserve facing direction ("face-right")
        this.oatchi.classList.remove("walk-edge");
        this.oatchi.classList.add("jump"); //CSS Animation: translate Oatchi upwards
        this.set_transition(() => this.oatchiGoIdle(), 200);
    }

    /// Assign correct animation image, remove unwanted CSS animation classes, and begin left/right walk sequence.
    oatchiGoIdle() {
        this.oatchi.src = "./Oatchi-walk.gif"

        // Remove any animations except for "face-right"
        this.oatchi.classList.remove("jump");

        // Resume walking to the left or right edge of the screen based on what direction Oatchi is already facing
        this.oatchi.classList.add("walk-edge");
        this.set_transition(() => this.oatchiWalkToOtherEdge(), this.walkTransitionDuration);
    }/*IDLE ENDS */

    /// Spend 2 seconds walking from one edge to the other in which ever direction Oatchi is now facing
    /*WALK TO EDGE OF SCREEN */
    oatchiWalkToOtherEdge() {
        this.oatchi.classList.toggle("face-right");
        this.set_transition(() => this.oatchiWalkToOtherEdge(), this.walkTransitionDuration);
    } 

    /// Walk to the center of the screen, then spend duration eating, then return to idle animation
    oatchiFeed() {
        this.oatchiWalkCenterThen(() => {
            this.oatchi.src = "./Oatchi-feed.gif";
            this.set_transition(() => {
                // Fill up half the hunger bar up to its max at end of animation
                Scene.incrementStat(this.state.hunger, this.state.hunger.max / 2);
                this.oatchiGoIdle()
            }, this.feedDuration);
        })
    }/*FEED ENDS */

    /// Walk to the center of the screen, then spend duration pooping, then return to idle animation
    oatchiPoop() {
        this.oatchiWalkCenterThen(() => {
            this.oatchi.src = "./Oatchi-poop.gif";
            this.set_transition(() => {
                // Pop doesn't leave body until end of animation
                this.state.poop.value = 0;
                this.oatchiGoIdle();
            }, this.poopDuration);
        })
    } /*POOP ENDS */

    /// Walk to the center of the screen, then spend duration sleeping, then return to idle animation
    oatchiSleep() {
        this.oatchiWalkCenterThen(() => {
            this.oatchi.src = "./Oatchi-sleep.png";
            this.set_transition(() => {
                // updates sleepiness state to the max after end of animation
                this.state.sleep.value = this.state.sleep.max;
                this.oatchiGoIdle();
            }, this.sleepingDuration);
        })
    }/*SLEEP ENDS */

    /// Walk to the center of the screen, then spend duration bathing, then return to idle animation
    oatchiBath() {
        this.oatchiWalkCenterThen(() => {
            this.oatchi.src = "./Oatchi-bath.png";
            //updates cleanliness state to the max
            this.state.cleanliness.value = this.state.cleanliness.max;
            //transitions from Bath to Idle animation
            this.set_transition(() => this.oatchiGoIdle(), this.bathDuration);
        })
    }/*BATH ENDS */
}