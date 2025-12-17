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
      puckY: 50,
      puckVisible: false,
      shots:0,
      goals:0,
      bonus:0,
      message:"",
      bestScore: localStorage.getItem('bestScore') || 0
    };
  },
  computed: {
    selectedPlayer() { return this.players.find(p => p.id==this.selectedPlayerId); },
    selectedGoalie() { return this.goalies.find(g => g.id==this.selectedGoalieId); },
    goalieStyle() { return { left: this.goalieX + "%" }; },
    puckStyle() { return { left: this.puckX + "%", bottom: this.puckY + "px" }; }
  },
  methods:{
    moveGoalie(){
      if(!this.selectedGoalie) return;
      let range = this.difficulty==='easy'?10:this.difficulty==='medium'?18:25;
      this.goalieX = 50 + (Math.random()*range*2 - range);
    },
    shoot(e){
      if(!this.selectedPlayer || !this.selectedGoalie){
        this.message="Select a shooter and goalie!";
        return;
      }
      this.shots++;
      this.puckVisible=true;
      const rink=e.currentTarget.getBoundingClientRect();
      const clickX=((e.clientX - rink.left)/rink.width)*100;
      this.puckX=clickX;
      this.puckY=360;
      new Audio('sounds/shoot.mp3').play();
      const goalieDiff=Math.abs(clickX - this.goalieX);
      const saved=goalieDiff<(this.selectedGoalie.reaction - this.selectedPlayer.accuracy +1)*12;
      setTimeout(()=>{
        if(saved){ new Audio('sounds/save.mp3').play(); this.message="Saved!"; }
        else{
          new Audio('sounds/goal.mp3').play();
          this.goals++;
          if(clickX<30 || clickX>70){ this.bonus++; this.message="Goal! 🎯 Top corner!"; }
          else this.message="Goal!";
        }
        if(this.goals>this.bestScore){ this.bestScore=this.goals; localStorage.setItem('bestScore',this.bestScore);}
        this.puckVisible=false;
      },450);
    }
  },
  mounted(){
    fetch("players.json").then(r=>r.json()).then(d=>this.players=d);
    fetch("goalies.json").then(r=>r.json()).then(d=>this.goalies=d);
    setInterval(this.moveGoalie,900);

    // Snowfall
    const canvas=document.getElementById('snow');
    const ctx=canvas.getContext('2d');
    canvas.width=window.innerWidth; canvas.height=window.innerHeight;
    const snowflakes=[];
    for(let i=0;i<100;i++){snowflakes.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:Math.random()*3+1,d:Math.random()});}
    let angle=0;
    function drawSnow(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle="white"; ctx.beginPath();
      snowflakes.forEach(f=>{ctx.moveTo(f.x,f.y);ctx.arc(f.x,f.y,f.r,0,Math.PI*2);});
      ctx.fill();
      angle+=0.01;
      snowflakes.forEach(f=>{f.y+=Math.cos(angle+f.d)+1+f.r/2; f.x+=Math.sin(angle)*2; if(f.y>canvas.height){f.y=0;f.x=Math.random()*canvas.width;}});
    }
    setInterval(drawSnow,33);
    window.addEventListener('resize',()=>{canvas.width=window.innerWidth;canvas.height=window.innerHeight;});
  }
});

app.mount("#app");
