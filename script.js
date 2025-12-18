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
    const goalImg = document.querySelector(".goal");
    const goalieImg = document.querySelector(".goalie");

    const goalBox = goalImg.getBoundingClientRect();
    const goalieBox = goalieImg.getBoundingClientRect();

    const x = e.clientX;
    const y = e.clientY;

    // Define the precise goalie area (only middle part of the image)
    const goalieActiveLeft = goalieBox.left + goalieBox.width * 0.15;
    const goalieActiveRight = goalieBox.right - goalieBox.width * 0.15;
    const goalieActiveTop = goalieBox.top + goalieBox.height * 0.1;
    const goalieActiveBottom = goalieBox.bottom - goalieBox.height * 0.05;

    const hitsGoalie =
      x >= goalieActiveLeft &&
      x <= goalieActiveRight &&
      y >= goalieActiveTop &&
      y <= goalieActiveBottom;

    // Define goal area (inside the goal posts)
    const goalActiveLeft = goalBox.left + goalBox.width * 0.05;
    const goalActiveRight = goalBox.right - goalBox.width * 0.05;
    const goalActiveTop = goalBox.top + goalBox.height * 0.05;
    const goalActiveBottom = goalBox.bottom;

    const hitsGoal =
      x >= goalActiveLeft &&
      x <= goalActiveRight &&
      y >= goalActiveTop &&
      y <= goalActiveBottom &&
      !hitsGoalie;

    if (hitsGoalie) {
      new Audio("sounds/save.mp3").play();
      this.message = "SAVE!";
    } else if (hitsGoal) {
      new Audio("sounds/goal.mp3").play();
      this.goals++;

      // Top corner bonus: upper 25% and outer 25% of goal image
      const leftCorner = goalActiveLeft + 0.25 * (goalActiveRight - goalActiveLeft);
      const rightCorner = goalActiveRight - 0.25 * (goalActiveRight - goalActiveLeft);
      const topLine = goalActiveTop + 0.25 * (goalActiveBottom - goalActiveTop);

      if ((x <= leftCorner || x >= rightCorner) && y <= topLine) {
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
