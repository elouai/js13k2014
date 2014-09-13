ig.module('game.entities.player')
.requires(
          //'impact.debug.debug',
          'impact.entity'
          )
.defines(function(){
  
  
  

  
  
  
  
  
  
  
  
  
  
  
  
  EntityPlayer = ig.Entity.extend({
    
    // parent
    size:{x:10,y:15},
    offset:{x:3,y:0},
    animSheet: new ig.AnimationSheet('media/player.png',16,16),
    maxVel:{x:100,y:100},
    bounciness:0.3,
    type: ig.Entity.TYPE.A,
    
    // user defined variables
    // MOVEMENT
    force:120, // constant force
    angleto:-1.1,  // angle heading towards
    cangle:0, // current angle, 
    dangle:0, // change to angle, delta angle
    rangle:0, // remainder angle. smallest should be 0.01 (test)
    dinc:9, // divide increment, (max can be 2), how quickly to change direction
    
    gamestart: false,
    
    
    // SOUND
    /*
    sndbop: new Audio(), // helicoptor wop
    sndtoc: new Audio(), // on change direction
    sndbang: new Audio(), // on hit wall
    
    sndta : new Audio(), // taa
    sndda : new Audio(), // daa
    */
    timershake: null, // use for screen shake
    timersmoke: null, // use to generate smoke trails
    
    init:function(x,y,settings)
    {
      this.addAnim('idle',.08,[0,1]);
      this.addAnim('flyleft',.08,[2,3]);
      this.addAnim('flyright',.08,[4,5]);
      this.addAnim('empty',1,[10], true); // empty frame
      
      this.currentAnim = this.anims.idle;
      //3,,0.3093,0.2775,0.15,0.0309,,0.2023,,,,-0.3312,0.8865,,,,,,1,,,,,0.5
      //var soundURLtoc = jsfxr([0,,0.0628,0.11,0.14,0.18,,-0.2199,-0.72,0.28,0.62,-0.38,0.15,,,0.78,1,-1,0.28,,,,,0.44]); 
      //var soundURLbop = jsfxr([2,,0.0918,0.1,0.11,0.23,,0.4399,-0.74,,,,,,0.9199,0.65,,,1,,,,,0.5]);
      //var soundURLbang = jsfxr([3,,0.3093,0.2775,0.15,0.0309,,0.2023,,,,-0.3312,0.8865,,,,,,1,,,,,0.5]);
      
      //var soundURLda = jsfxr([0,,0.082,0.69,0.4,0.56,,-0.02,-0.02,,,0.4678,0.5108,,,,,,1,,,,,0.5]); 
      /*
      this.sndbop.src = soundURLbop;  
      this.sndbop.volume = .05;
      this.sndtoc.src = soundURLtoc;  
      this.sndtoc.volume = .3;
      this.sndbang.src = soundURLbang; 
      this.sndbang.volume = .3;
      
      this.sndda.src = soundURLda; 
      this.sndda.volume = .3;
      */
      this.parent(x,y,settings);
    },
    
    
    update:function()
    {
      this.parent();
      
      if (!this.gamestart) // wait for spacebar before starting game.
      {
        if ((this.currentAnim == this.anims.empty) && (ig.input.pressed('space')) )
        {
          this.pos.x = 160;
          this.pos.y = ig.game.cmap.length*32 - 32;
          this.vel.y = 0;
          this.vel.x = 0;
          this.accel.y = 0;
          this.accel.x = 0;
          
          if (ig.game.score > ig.game.hiscore)
          {
            //this.sndda.play();
            ig.game.hiscore = ig.game.score;
          }
          ig.game.score = 0;
          
          this.currentAnim = this.anims.idle;
        } else if (ig.input.pressed('space'))
        {
          this.timersmoke = new ig.Timer(0.3);
          this.gamestart = true;
        }
      }
      
      if (this.gamestart) // Game started?
      {
        
        // user input
        if (ig.input.pressed('space'))
        {
          this.angleto = -this.angleto;
          if (this.angleto>0)   this.currentAnim = this.anims.flyright;
          else                  this.currentAnim = this.anims.flyleft;
          //this.sndtoc.play();
        }
        
        // angled flying
        var seed = Math.random() - .5; // make copter shake
        this.dangle = ((this.cangle - (this.angleto+seed)) / this.dinc).toFixed(3); //  (0 - 1.04) / 4 = -.26   
        this.cangle = Number(this.cangle - this.dangle);
        var vx = Math.sin(this.cangle)*this.force;
        var vy = Math.cos(this.cangle)*this.force;
        this.accel.x = vx;
        this.accel.y = -vy;
        this.currentAnim.angle = this.cangle;
        
        // generate smoke at specific intervals
        if (this.timersmoke && this.timersmoke.delta() > 0)
        {
          this.timersmoke.reset();
          ig.game.spawnEntity( EntitySmoke, this.pos.x+1, this.pos.y+8 );
        }
        
        //this.sndbop.play();
      }
      
      // screen follows player
      var sx = 0,sy = 0;
      if (this.timershake && this.timershake.delta() < 0) { sx = Math.floor(Math.random()*10)-4; sy = Math.floor(Math.random()*10)-4; } // then keep shaking
      else {this.timershake = null;}
      
      var xx = this.pos.x + sx + this.size.x/2 - ig.system.width/2;
      var yy = this.pos.y + sy + this.size.y - ig.system.height + 16;
      if (xx < 0) xx = 0;
      if (xx > 77) xx = 77;
      ig.game.screen.x = xx;
      ig.game.screen.y = yy; 
    },
    
    
    handleMovementTrace: function( res )
    {
      // Continue resolving the collision as normal
      this.parent(res);
      
      if (!this.gamestart)  return;
      
      if (res.collision.y || res.collision.x)
      {
        ig.game.spawnEntity( EntityPlayerDeath, this.pos.x+1, this.pos.y+4 );
        //this.sndbang.play();
        this.currentAnim = this.anims.empty;
        this.anims.empty.rewind();
        this.vel.y = 0;
        this.vel.x = 0;
        this.accel.y = 0;
        this.accel.x = 0;
        
        
        this.gamestart = false;
        this.timershake = new ig.Timer(0.4);
      }
    },

    
    draw:function()
    {
      this.parent();
    }
  });

  



  
  EntityPlayerDeath = ig.Entity.extend({
    size: {x:6, y:6},
    offset: {x:5, y:6},
    animSheet: new ig.AnimationSheet( 'media/player.png', 16, 16 ),
    type: ig.Entity.TYPE.A,
    maxVel:{x:100,y:100},
    bounciness:0.5,
    
    anglerot:0,
    dangle:0,
    cangle:0,
    
    init: function( x, y, settings )
    {
      this.addAnim('die',.16,[6,7,8,9], true);
      this.anglerot = (Math.random() - .5)/20; // randomize rotation speed
      this.parent( x, y, settings );
    },
    
    
    handleMovementTrace: function( res )
    {
      // Continue resolving the collision as normal
      this.parent(res);
  
      if (res.collision.y || res.collision.x)
      {
        // sound poc
      }
    },
    
    update:function()
    {
      this.parent();
      
      // make head rotate
      this.dangle =  this.vel.y*this.anglerot; //((this.cangle - (this.angleto+seed)) / this.dinc).toFixed(3); //  (0 - 1.04) / 4 = -.26   
      this.cangle = Number(this.cangle - this.dangle);
      
      this.currentAnim.angle = this.cangle;
    }
  
  });
  



  
  EntitySmoke = ig.Entity.extend({
    size: {x:16, y:16},
    offset: {x:0, y:0},
    animSheet: new ig.AnimationSheet( 'media/player.png', 16, 16 ),
    type: ig.Entity.TYPE.NONE,
    maxVel:{x:100,y:100},
    bounciness:0,
    gravityFactor:0,
    
    timerdeath:null,
    
    
    init: function( x, y, settings )
    {
      this.addAnim('smoke',.32,[11,12,13], true);
      this.timerdeath = new ig.Timer(1.5);
      this.vel.y = -28;
      this.parent( x, y, settings );
    },
    
    update:function()
    {
      this.parent();
      
      if (this.timerdeath.delta() > 0)
      {
        this.kill();
      }
      
    }
    
  });


})




    
    
