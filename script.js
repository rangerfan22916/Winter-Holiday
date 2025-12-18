const app = Vue.createApp({
  data() {
    return {
      players: [],
      goalies: [],
      selectedPlayerId: "",
      selectedGoalieId: "",
      difficulty: "medium",
      goalieX: 50, // percentage position of goalie
      puckX: 50,
      puckY: 45,
      puckVisible: false,
      shots: 0,
      goals: 0,
      bonus: 0,
      message: "",
      bestScore: Number(localStorage.getItem("bestScore")) || 0,
      goalieTimer: null
    };
  },
  computed: {
    selectedPlayer() {
      return this.players.find(p => p.id == this.selectedPlayerId);
    },
    selectedGoalie() {
      return this.goalies.find(g => g.id == this.selectedGoalieId);
    },
    goalieStyle() {
      return { left: this.goalieX + "%" };
    },
    puckStyle() {
      return {
        left: this.puckX + "%",
        bottom: this.puckY + "px"
      };
    }
  },
  methods: {
    moveGoalie() {
      if (!this.selectedGoalie) return;

      let range, speed;
      if (this.difficulty === "easy") {
        range = 10; speed = 1200;
      } else if (this.difficulty === "medium") {
        range = 16; speed = 800;
      } else {
        range = 22; speed = 500;
      }

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

      const rink = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rink.left;
      const clickY = e.clientY - rink.top;

      this.puckX = (clickX / rink.width) * 100;
      this.puckY = rink.height - clickY;

      new Audio("sounds/shoot.mp3").play();

      setTimeout(() => {
        // Define the actual visible net coordinates inside rink
        const goalTop = rink.height * 0.15; // top edge of net
        const goalBottom = rink.height * 0.50; // bottom edge of net
        const goalLeft = rink.width * 0.30; // left edge of net
        const goalRight = rink.width * 0.70; // right edge of net

        // Goalie box relative to goal, using goalieX position
        const goalieImg = document.querySelector(".goalie");
        const goalieWidth = goalieImg.offsetWidth;
        const goalieHeight = goalieImg.offsetHeight;

        const goalieLeft = rink.left + (this.goalieX / 100) * rink.width - goalieWidth / 2;
        const goalieRight = goalieLeft + goalieWidth;
        const goalieTop = rink.top + goalTop;
        const goalieBottom = goalieTop + goalieHeight;

        const puckXPos = e.clientX;
        const puckYPos = e.clientY;

        // Check goalie save
        const hitsGoalie =
          puckXPos >= goalieLeft &&
          puckXPos <= goalieRight &&
          puckYPos >= goalieTop &&
          puckYPos <= goalieBottom;

        // Check goal
        const hitsGoal =
          puckXPos >= rink.left + goalLeft &&
          puckXPos <= rink.left + goalRight &&
          puckYPos >= rink.top + goalTop &&
          puckYPos <= rink.top + goalBottom &&
          !hitsGoalie;

        if (hitsGoalie) {
          new Audio("sounds/save.mp3").play();
          this.message = "SAVE!";
        } else if (hitsGoal) {
          new Audio("sounds/goal.mp3").play();
          this.goals++;

          // Top corner bonus
          const topLine = rink.top + goalTop + 0.25 * (goalBottom - goalTop);
          const leftCorner = rink.left + goalLeft + 0.25 * (goalRight - goalLeft);
          const rightCorner = rink.left + goalRight - 0.25 * (goalRight - goalLeft);

          if ((puckXPos <= leftCorner || puckXPos >= rightCorner) && puckYPos <= topLine) {
            this.bonus++;
            this.message = "TOP CORNER!";
          } else {
            this.message = "GOAL!";
          }
        } else {
          this.message = "MISS!";
        }

        if (this.goals > this.bestScore) {
          this.bestScore = this.goals;
          localStorage.setItem("bestScore", this.bestScore);
        }

        this.puckVisible = false;
        this.puckY = 45;
      }, 450);
    }
  },
  mounted() {
    fetch("players.json").then(r => r.json()).then(d => this.players = d);
    fetch("goalies.json").then(r => r.json()).then(d => this.goalies = d);
    this.moveGoalie();

    // Snow effect
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
    difficulty() {
      this.moveGoalie();
    },
    selectedGoalieId() {
      this.moveGoalie();
    }
  }
});

app.mount("#app");
