class Scene {
    constructor() {
        this.state = {
            hunger: {
                display: "Food",
                value:   5, //DEFAULT value
                min:     0, //MIN Value user can have
                max:     8, //MAX value user can gain
                tick:    -1/8, //Tick increment 1/8 of 1 second
                click:   2, //Button Increments per click by 2
                button:  null, //Button will be added later onLoad()
            },
            cleanliness: {
                display: "Cleanliness",
                value:   5,
                min:     0,
                max:     8,
                tick:    -1/32,
                click:   1,
                button:  null,
            },
            sleep: {
                display: "Sleep",
                value:   5,
                min:     0,
                max:     8,
                tick:    -1/16,
                click:   1,
                button:  null,
            },
            play: {
                display: "Play",
                value:   5,
                min:     0,
                max:     8,
                tick:    -1/8,
                click:   2,
                button:  null,
            },
            poop: {
                display: "Treasure",
                value:   5,
                min:     0,
                max:     8,
                tick:    0,  // stat incremented only if food is non-zero
                click:   0,  // read-only
                button:  null,
            }
        };

        // Read this value from the CSS as the transition on `left`. We can't use `transionend` event
        // because we're using multiple transition durations on different CSS fields.
        this.walkTransitionDuration = 2000;

        this.poopDuration = 3000;
        this.sleepingDuration = 10000;
        this.bathDuration = 5000;

        // This is called before the DOM has loaded, so wouldn't be able to find elements by ID here.
    }

    onload() {
        // Wait to begin Oatchi logic until the Oatchi image and animations have loaded.
        // The DOM is also guaranteed to have been loaded by now.

        this.oatchi = document.getElementById("oatchi");
        this.oatchi.addEventListener("click", () => this.oatchiClicked());
        this.pendingEvent = 0;
        // Referencing elements and setting them into the state's buttons
        this.state.hunger.button      = document.getElementById("food");
        this.state.cleanliness.button = document.getElementById("cleanliness");
        this.state.sleep.button       = document.getElementById("sleep");
        this.state.play.button        = document.getElementById("play");
        this.state.poop.button        = document.getElementById("poop");

        // For now food instantly ends up in his belly
        this.state.hunger.button.addEventListener("click", () => Scene.statClicked(this.state.hunger));

        this.state.sleep.button.addEventListener("click", () => this.oatchiSleep());
        this.state.cleanliness.button.addEventListener("click", () => this.oatchiBath());
        
        // For every stat above, attach click listeners and populate its text
        for (const statName in this.state){
            // Some stats won't have buttons associated with them (are hidden stats)
            const stat = this.state[statName];
            if (stat.button){
                Scene.updateButtonText(stat);
            }
        }

        // Careful not to overwrite this.pendingEvent after this because oatchiGoIdle() assigns a value to it
        this.oatchiGoIdle();
    }

    onunload() {
        // Perform any cleanup or saving tasks here
    }

    //Instead of every action having its own setInterval(), they all share a single once a second update function
    tick() {
        // Rather than having separate interval events for each state, subtract a small amount from each state on every tick
        if (this.state.hunger.value > 0){
            this.state.poop.tick = -this.state.hunger.tick; //pooping is dependent on being full
        }
        else{
            // Can't poop if not fed
            this.state.poop.tick = 0;
        }

        for (const statName in this.state){
            const stat = this.state[statName];

            // increment could be negative or positive, so clamp the post-modified value
            stat.value = Math.min(Math.max(stat.value + stat.tick, stat.min), stat.max);

            // Some stats won't have buttons associated with them (are hidden stats)
            if (stat.button){
                Scene.updateButtonText(stat);
            }
        }

        if (this.oatchi.classList.contains("walk-edge")){
            // Oatchi is in his idle state. Don't wake up Oatchi for him to take a poop.
            // This also prevents mistakenly canceling and rescheduling events on every tick preventing them from ever running.
            if (this.state.poop.value == this.state.poop.max){
                this.oatchiPoop();
            }
        }
    }

    static statClicked(stat) {
        stat.value = Math.min(stat.max, stat.value + stat.click);
        Scene.updateButtonText(stat);
    }
    //updates stat text on the button
    static updateButtonText(stat) {
        stat.button.textContent = `${stat.display}: ${Math.ceil(stat.value)}`;
    }

    oatchIsOnLeft() {
        const style = window.getComputedStyle(this.oatchi);
        const oatchiCenter = parseInt(style.left) + parseInt(style.width) / 2;
        return (oatchiCenter < (window.innerWidth / 2));
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
        this.oatchi.classList.toggle("face-right", this.oatchIsOnLeft());
        
        this.set_transition(nextTransition, 1000);
    }
    /*Make Oatchi jump when clicked */
    oatchiClicked() {
        Scene.statClicked(this.state.play);
        
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

    /// Walk to the center of the screen, then spend duration pooping, then return to idle animation
    oatchiPoop() {
        this.oatchiWalkCenterThen(() => {
            this.oatchi.src = "./Oatchi-poop.png"
            this.state.poop.value = this.state.poop.min;
            this.set_transition(() => this.oatchiGoIdle(), this.poopDuration);
        })
    } /*POOP ENDS */

    /// Walk to the center of the screen, then spend duration sleeping, then return to idle animation
    oatchiSleep() {
        this.oatchiWalkCenterThen(() => {
            this.oatchi.src = "./Oatchi-sleep.png"
            //updates sleepiness state to the max
            this.state.sleep.value = this.state.sleep.max;
            //Transitions from Sleeping to Idle animation
            this.set_transition(() => this.oatchiGoIdle(), this.sleepingDuration);
        })
    }/*SLEEP ENDS */

    /// Walk to the center of the screen, then spend duration bathing, then return to idle animation
    oatchiBath() {
        this.oatchiWalkCenterThen(() => {
            this.oatchi.src = "./Oatchi-bath.png" 
            //updates cleanliness state to the max
            this.state.cleanliness.value = this.state.cleanliness.max;
            //transitions from Bath to Idle animation
            this.set_transition(() => this.oatchiGoIdle(), this.bathDuration);
        })
    }/*BATH ENDS */
}