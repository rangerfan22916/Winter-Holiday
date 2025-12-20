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

      // AUDIO
      shootAudio: new Audio("sounds/shot.mp3"),
      goalAudio: new Audio("sounds/goal_horn.mp3"),
      awwAudio: new Audio("sounds/aww.mp3"),
      postAudio: new Audio("sounds/ding.mp3")
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

      // SHOT SOUND (6s → 7s)
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

        const goalLeft = goalRect.left;
        const goalRight = goalRect.right;
        const goalTop = goalRect.top;
        const goalBottom = goalRect.bottom;

        const goalWidth = goalRight - goalLeft;
        const goalHeight = goalBottom - goalTop;

        // NORMALIZED GOALIE HITBOX
        const goalieWidth = goalWidth * 0.25;
        const goalieHeight = goalHeight * 0.9;
        const goalieCenterX = goalLeft + (goalWidth * this.goalieX / 100);

        const goalieLeft = goalieCenterX - goalieWidth / 2;
        const goalieRight = goalieCenterX + goalieWidth / 2;
        const goalieTop = goalBottom - goalieHeight;
        const goalieBottom = goalBottom;

        const puckX = e.clientX;
        const puckY = e.clientY;

        const inGoal =
          puckX >= goalLeft &&
          puckX <= goalRight &&
          puckY >= goalTop &&
          puckY <= goalBottom;

        const hitsGoalie =
          inGoal &&
          puckX >= goalieLeft &&
          puckX <= goalieRight &&
          puckY >= goalieTop &&
          puckY <= goalieBottom;

        // POST ZONE
        const postThickness = goalWidth * 0.03;
        const hitsLeftPost =
          puckX >= goalLeft &&
          puckX <= goalLeft + postThickness &&
          puckY >= goalTop &&
          puckY <= goalBottom;

        const hitsRightPost =
          puckX <= goalRight &&
          puckX >= goalRight - postThickness &&
          puckY >= goalTop &&
          puckY <= goalBottom;

        // TOP CORNER
        const topLine = goalTop + goalHeight * 0.25;
        const leftCorner = goalLeft + goalWidth * 0.2;
        const rightCorner = goalRight - goalWidth * 0.2;

        const isTopCorner =
          puckY <= topLine &&
          (puckX <= leftCorner || puckX >= rightCorner);

        // ===== RESULT LOGIC =====
        if (hitsGoalie) {
          this.message = "SAVE!";
          this.awwAudio.currentTime = 0.3;
          this.awwAudio.play();

        } else if (hitsLeftPost || hitsRightPost) {
          this.message = "POST!";
          this.postAudio.currentTime = 0;
          this.postAudio.play();

        } else if (inGoal) {
          this.goals++;

          if (isTopCorner) {
            this.bonus++;
            this.message = "TOP CORNER!";

            this.postAudio.currentTime = 0;
            this.postAudio.play();

            setTimeout(() => {
              this.goalAudio.currentTime = 2;
              this.goalAudio.play();
              setTimeout(() => this.goalAudio.pause(), 2000);
            }, 150);

          } else {
            this.message = "GOAL!";
            this.goalAudio.currentTime = 2;
            this.goalAudio.play();
            setTimeout(() => this.goalAudio.pause(), 2000);
          }

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

      }, 50);
    }
  },

  mounted() {
    fetch("players.json").then(r => r.json()).then(d => this.players = d);
    fetch("goalies.json").then(r => r.json()).then(d => this.goalies = d);
    this.moveGoalie();
  },

  watch: {
    difficulty() { this.moveGoalie(); },
    selectedGoalieId() { this.moveGoalie(); }
  }
});

app.mount("#app");
