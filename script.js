const app = Vue.createApp({
  data() {
    return {
      players: [],
      goalies: [],
      selectedPlayerId: "",
      selectedGoalieId: "",
      difficulty: "medium",

      goalieX: 50,
      puckX: 50,
      puckY: 45,
      puckVisible: false,

      shots: 0,
      goals: 0,
      bonus: 0,
      message: "",
      bestScore: Number(localStorage.getItem("bestScore")) || 0,
      goalieTimer: null,

      // Audio elements
      goalAudio: new Audio("sounds/goal_horn.mp3"),
      awwAudio: new Audio("sounds/aww.mp3"),
      shootAudio: new Audio("sounds/shot.mp3")
    };
  },

  computed: {
    selectedPlayer() { return this.players.find(p => p.id == this.selectedPlayerId); },
    selectedGoalie() { return this.goalies.find(g => g.id == this.selectedGoalieId); },
    goalieStyle() { return { left: this.goalieX + "%" }; },
    puckStyle() { return { left: this.puckX + "%", bottom: this.puckY + "px" }; }
  },

  methods: {
    moveGoalie() {
      if (!this.selectedGoalie) return;

      let range, speed;
      if (this.difficulty === "easy") { range = 10; speed = 1200; }
      else if (this.difficulty === "medium") { range = 16; speed = 800; }
      else { range = 22; speed = 500; }

      clearInterval(this.goalieTimer);
      this.goalieX = 50;

      this.goalieTimer = setInterval(() => {
        this.goalieX = 50 + (Math.random() * range * 2 - range);
      }, speed);
    },

    shoot(e) {
      if (!this.selectedPlayer || !this.selectedGoalie) {
        this.message = "SELECT PLAYER & GOALIE";
        return;
      }

      this.shots++;
      this.puckVisible = true;

      // Play shot sound immediately (start at 6s, end at 7s)
      this.shootAudio.currentTime = 6;
      this.shootAudio.play();
      setTimeout(() => this.shootAudio.pause(), 1000);

      const rink = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rink.left;
      const clickY = e.clientY - rink.top;

      this.puckX = (clickX / rink.width) * 100;
      this.puckY = rink.height - clickY;

      setTimeout(() => {
        const goalRect = document.querySelector(".goal-wrapper").getBoundingClientRect();
        const goalieRect = document.querySelector(".goalie").getBoundingClientRect();

        const puckX = e.clientX;
        const puckY = e.clientY;

        // Goal boundaries
        const goalLeft = goalRect.left;
        const goalRight = goalRect.right;
        const goalTop = goalRect.top;
        const goalBottom = goalRect.bottom;

        // Goalie boundaries
        const goalieLeft = goalieRect.left;
        const goalieRight = goalieRect.right;
        const goalieTop = goalieRect.top;
        const goalieBottom = goalieRect.bottom;

        // Check if puck is inside goal
        const inGoalArea = puckX >= goalLeft && puckX <= goalRight && puckY >= goalTop && puckY <= goalBottom;

        // Check if puck hits goalie inside goal vertical bounds
        const hitsGoalie = puckX >= goalieLeft && puckX <= goalieRight && puckY >= goalieTop && puckY <= goalieBottom && puckY >= goalTop && puckY <= goalBottom;

        if (hitsGoalie) {
          this.message = "SAVE!";
          this.awwAudio.currentTime = 0.3;
          this.awwAudio.play();
        } else if (inGoalArea) {
          this.goals++;

          // Top corner bonus
          const goalWidth = goalRight - goalLeft;
          const goalHeight = goalBottom - goalTop;
          const topLine = goalTop + goalHeight * 0.25;
          const leftCorner = goalLeft + goalWidth * 0.2;
          const rightCorner = goalRight - goalWidth * 0.2;

          if (puckY <= topLine && (puckX <= leftCorner || puckX >= rightCorner)) {
            this.bonus++;
            this.message = "TOP CORNER!";
          } else {
            this.message = "GOAL!";
          }

          // Play goal horn starting at 2s, stop after 2s
          this.goalAudio.currentTime = 2;
          this.goalAudio.play();
          setTimeout(() => this.goalAudio.pause(), 2000);

        } else {
          this.message = "MISS!";
          this.awwAudio.currentTime = 0.3;
          this.awwAudio.play();
        }

        if (this.goals > this.bestScore) {
          this.bestScore = this.goals;
          localStorage.setItem("bestScore", this.bestScore);
        }

        this.puckVisible = false;
        this.puckY = 45;
      }, 50); // shorter timeout for immediate hit detection
    }
  },

  mounted() {
    fetch("players.json").then(r => r.json()).then(d => this.players = d);
    fetch("goalies.json").then(r => r.json()).then(d => this.goalies = d);

    this.moveGoalie();

    // ❄️ Snow effect
    const canvas = document.getElementById("snow");
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const flakes = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 3 + 1,
      d: Math.random()
    }));

    let angle = 0;
    setInterval(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";
      ctx.beginPath();
      flakes.forEach(f => {
        ctx.moveTo(f.x, f.y);
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      });
      ctx.fill();

      angle += 0.01;
      flakes.forEach(f => {
        f.y += Math.cos(angle + f.d) + 1 + f.r / 2;
        f.x += Math.sin(angle) * 2;
        if (f.y > canvas.height) {
          f.y = 0;
          f.x = Math.random() * canvas.width;
        }
      });
    }, 33);
  },

  watch: {
    difficulty() { this.moveGoalie(); },
    selectedGoalieId() { this.moveGoalie(); }
  }
});

app.mount("#app");
