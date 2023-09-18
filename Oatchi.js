class Oatchi {
    constructor() {
      this.state = {
        hunger: 5,
        cleanliness: 5,
        sleep: 5,
        play: 5,
      };
  
      this.hungerTimer = setInterval(() => {
        this.decrementHunger();
      }, 8000);
  
      console.log("Oatchi: setInterval Hunger was called");
  
      this.incrementHunger = this.incrementHunger.bind(this);
      this.incrementCleanliness = this.incrementCleanliness.bind(this);
      this.incrementPlay = this.incrementPlay.bind(this);
    }
  
    decrementHunger() {
      if (this.state.hunger > 0) {
        this.state.hunger--;
        this.render();
      }
    }
  
    incrementHunger() {
      this.state.hunger++;
      this.render();
    }
  
    incrementCleanliness() {
      this.state.cleanliness++;
      this.render();
    }
  
    incrementPlay() {
      this.state.play++;
      this.render();
    }
  
    render() {
      const foodButton = document.createElement("button");
      foodButton.textContent = `Food ${this.state.hunger}`;
      foodButton.addEventListener("click", this.incrementHunger);
  
      const cleanlinessButton = document.createElement("button");
      cleanlinessButton.textContent = `Cleanliness ${this.state.cleanliness}`;
      cleanlinessButton.addEventListener("click", this.incrementCleanliness);
  
      const playButton = document.createElement("button");
      playButton.textContent = `Play ${this.state.play}`;
      playButton.addEventListener("click", this.incrementPlay);
  
      // Clear the previous content
      document.body.innerHTML = "";
  
      const container = document.createElement("div");
      container.appendChild(foodButton);
      container.appendChild(cleanlinessButton);
      container.appendChild(playButton);
  
      document.body.appendChild(container);
    }
  }
  
  const oatchiInstance = new Oatchi();
  oatchiInstance.render();