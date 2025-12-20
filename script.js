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

      shootAudio: new Audio("sounds/shot.mp3"),
      goalAudio: new Audio("sounds/goal_horn.mp3"),
      awwAudio: new Audio("sounds/aww.mp3"),
      postAudio: new Audio("sounds/ding.mp3")
    };
  },

  computed: {
    selectedPlayer() {
      return this.players.find(p => p.id === Number(this.selectedPlayerId));
    },
    selectedGoalie() {
      return this.goalies.find(g => g.id === Number(this.selectedGoalieId));
    },
    goalieStyle() {
      return { left: this.goalieX + "%" };
    },
    puckStyle() {
      return { left: this.puckX + "%", bottom: this.puckY + "px" };
    }
  },

  methods: {
    /* ========= LOAD PLAYERS ========= */
    async loadCurrentPlayers() {
      this.players = [];
      this.selectedPlayerId = "";
      try {
        const res = await fetch("players.json");
        this.players = await res.json();
      } catch (e) { console.error("Failed to load current players", e); }
    },

    async loadOldPlayers() {
      this.players = [];
      this.selectedPlayerId = "";
      try {
        const res = await fetch("old_players.json");
        this.players = await res.json();
      } catch (e) { console.error("Failed to load old players", e); }
    },

    async loadCurrentGoalies() {
      this.goalies = [];
      this.selectedGoalieId = "";
      try {
        const res = await fetch("goalies.json");
        this.goalies = await res.json();
        this.startGoalieAI();
      } catch (e) { console.error("Failed to load current goalies", e); }
    },

    async loadOldGoalies() {
      this.goalies = [];
      this.selectedGoalieId = "";
      try {
        const res = await fetch("old_goalies.json");
        this.goalies = await res.json();
        this.startGoalieAI();
      } catch (e) { console.error("Failed to load old goalies", e); }
    },

    /* ========= GOALIE AI ========= */
    startGoalieAI() {
      clearInterval(this.goalieTimer);
      this.goalieX = 50;

      // Difficulty-specific AI
      let speed, maxMove;
      if (this.difficulty === "easy") { speed = 60; maxMove = 3; }
      else if (this.difficulty === "medium") { speed = 40; maxMove = 5; }
      else { speed = 0; maxMove = 100; } // hard = instant tracking

      this.goalieTimer = setInterval(() => {
        if (!this.selectedGoalie || !this.puckVisible) return;

        let diff = this.puckX - this.goalieX;

        if (this.difficulty !== "hard") {
          if (Math.abs(diff) > maxMove) diff = diff > 0 ? maxMove : -maxMove;
          this.goalieX += diff;
        } else {
          // Hard = follow puck instantly
          this.goalieX = this.puckX;
        }

        if (this.goalieX < 0) this.goalieX = 0;
        if (this.goalieX > 100) this.goalieX = 100;
      }, speed || 20);
    },

    /* ========= SHOOT ========= */
    shoot(e) {
      if (!this.selectedPlayer || !this.selectedGoalie) {
        this.message = "SELECT PLAYER & GOALIE";
        return;
      }

      this.shots++;
      this.puckVisible = true;

      // Shot sound
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

        // Goalie hitbox
        const goalieWidth = goalWidth * 0.25;
        const goalieHeight = goalHeight * 0.9;
        const goalieCenterX = goalLeft + (goalWidth * this.goalieX / 100);
        const goalieLeft = goalieCenterX - goalieWidth / 2;
        const goalieRight = goalieCenterX + goalieWidth / 2;
        const goalieTop = goalBottom - goalieHeight;
        const goalieBottom = goalBottom;

        const puckX = e.clientX;
        const puckY = e.clientY;

        const inGoal = puckX >= goalLeft && puckX <= goalRight && puckY >= goalTop && puckY <= goalBottom;
        const hitsGoalie = puckX >= goalieLeft && puckX <= goalieRight && puckY >= goalieTop && puckY <= goalieBottom;

        // Post
        const postThickness = goalWidth * 0.03;
        const hitsPost =
          ((puckX >= goalLeft && puckX <= goalLeft + postThickness) ||
           (puckX <= goalRight && puckX >= goalRight - postThickness)) &&
          puckY >= goalTop && puckY <= goalBottom;

        // Top corner
        const isTopCorner =
          puckY <= goalTop + goalHeight * 0.25 &&
          (puckX <= goalLeft + goalWidth * 0.2 || puckX >= goalRight - goalWidth * 0.2);

        /* ===== RESULT LOGIC ===== */
        if (hitsGoalie) {
          this.message = "SAVE!";
          this.awwAudio.currentTime = 0.3;
          this.awwAudio.play();

        } else if (hitsPost) {
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
    this.loadCurrentPlayers();
    this.loadCurrentGoalies();
  },

  watch: {
    difficulty() { this.startGoalieAI(); },
    selectedGoalieId() { this.startGoalieAI(); }
  }
});

app.mount("#app");
