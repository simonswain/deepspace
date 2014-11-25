/*global Backbone:true, $:true, _:true, App:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */

App.Views.make_universe = Backbone.View.extend({
  template: _.template('<div class="canvas"></div><div class="fx"></div>'),
  initialize : function(opts) {
    _.bindAll(this, 'onClose', 'render', 'start', 'stop', 'draw', 'tick');
    this.render();
    $(window).on('resize', this.render);
  },
  onClose: function(){
    $(window).off('resize', this.render);
    this.stop();
  },
  draw: function(){

    var self = this;

    if(!this.running){
      return;
    }

    var ctx = this.cview.getContext('2d');
    var ctxfx = this.fxview.getContext('2d');

    ctx.save();
    ctxfx.save();

    ctxfx.fillStyle = 'rgba(1,1,1,.01)';
    ctxfx.fillRect(0,0, this.cw,this.ch);

    ctx.clearRect(0,0,this.cw,this.ch);

    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);

    ctxfx.translate(this.x, this.y);
    ctxfx.scale(this.scale, this.scale);

    var xw = this.w/16;
    var xh = this.h/16;

    // draw here

    this.stars.forEach(function(star){
      ctx.strokeStyle = '#fff';
      ctx.fillStyle = '#999';
      ctx.lineWidth = xw/64;
      ctx.beginPath();
      ctx.arc(star.x, star.y, xw/64, 0, 2*Math.PI);
      ctx.stroke();
      ctx.fill();
      ctx.closePath();
    });

    this.ships.forEach(function(ship){
      var origin = ship.origin_star;
      if(origin){
        ctx.fillStyle = '#fff';
        ctx.lineWidth = xw/64;
        ctx.beginPath();
        ctx.arc(origin.x, origin.y, xw/16, 0, 2*Math.PI);
        ctx.fill();
        ctx.closePath();
      }

      var target = ship.target_star;
      if(target){
        ctx.fillStyle = ship.color;
        ctx.lineWidth = xw/64;
        ctx.beginPath();
        ctx.arc(target.x, target.y, xw/16, 0, 2*Math.PI);
        ctx.fill();
        ctx.closePath();
      }

      if(origin && target){

        var theta = G.angle(target.x, target.y, origin.x, origin.y);
        var range = G.distance(target.x, target.y, origin.x, origin.y);

        var dist = range * (1 - (ship.pct/100));

        var space_x = target.x - (dist * Math.cos(theta));
        var space_y = target.y - (dist * Math.sin(theta));

        ctx.strokeStyle = '#0ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(space_x, space_y, 4, 0, Math.PI*2);
        ctx.closePath();

        ctxfx.strokeStyle = ship.color;
        ctxfx.lineWidth = 2;
        ctxfx.beginPath();
        ctxfx.moveTo(origin.x, origin.y);
        ctxfx.lineTo(space_x, space_y);
        ctxfx.stroke();
        ctxfx.closePath();
       
      }

    });

    //

    ctx.restore();
    ctxfx.restore();

    this.requestId = window.requestAnimationFrame(this.draw);

  },
  tick: function(){

    var self = this;

    this.ships.forEach(function(ship){

      // origin and target

      if(!ship.origin_star){
        ship.origin_star = self.stars[random0to(self.stars.length-1)];
      };

      if(!ship.target_star){

        var targets  = _.reduce(
          self.stars, 
          function(list, target){
            var range = G.distance(ship.origin_star.x, ship.origin_star.y, target.x, target.y);
            if(range < ship.range){
              list.push(target);
            }
            return list;
          }, []);

        if(targets.length === 1) {
          ship.target_star = targets[0];
        } else if(targets.length > 1) {
          ship.target_star = targets[random0to(targets.length-1)];
        }

      }

      if(ship.origin_star && ship.target_star){
        if(!ship.pct){
          // starting jump
          ship.pct = 0;
        }

        ship.pct += ship.speed;
        if(ship.pct >= 100){
          ship.origin_star = ship.target_star;
          ship.target_star = null;
          ship.pct = null;
        }

      };
    });

    //
    
    if(this.tickTimer){
      clearTimeout(this.tickTimer);
    }
    this.tickTimer = setTimeout(this.tick.bind(this), this.period);
  },
  toggle: function(){
    if(this.shiplimit !== 16){
      this.speedfactor = 0.1;
      this.shiplimit = 16;
    } else {
      this.speedfactor = 0.2;
      this.shiplimit = 200;
    }
    this.init();
  },
  init: function(){
    var self = this;


    this.stars = [];
    while(this.stars.length < 500) {
      self.stars.push({
        x: random0to(self.w),
        y: random0to(self.h)
      });
    }

    var colors = ['#0f0','#f00','#00f'];

    this.ships = [];
    while(this.ships.length < this.shiplimit) {
      self.ships.push({
        color: colors[random0to(3)],
        speed: (10 + random0to(20)) * self.speedfactor,
        origin_star: null,
        target_star: null,
        range: 100,
        pct: null
      });
    }

    this.period = 25;

  },
  start: function () {    
    this.init();
    this.running = true;
    this.draw();
    setTimeout(this.tick.bind(this), this.period);

    // restart every 20s
  },
  stop: function(){
    this.running = false;
    if(this.tickTimer){
      clearTimeout(this.tickTimer);
    }
    if(this.requestId){
      window.cancelAnimationFrame(this.requestId);
      this.requestId = undefined;
    }
  },
  fitToView: function(){
    var sx = this.cw / this.w;
    var sy = this.ch / this.h;
    this.scale = Math.min(sx, sy);

    this.x = (this.cw / 2) - ((this.w * this.scale)/2);
    this.y = (this.ch / 2) - ((this.h * this.scale)/2);
  },
  render : function(){

    this.shiplimit = 16;
    this.speedfactor = 0.1;

    this.stop();
    this.$el.html(this.template());
    this.$('.canvas').html('<canvas id="canvas"></canvas>');
    this.$('.fx').html('<canvas id="fx"></canvas>');

    // virtual scren size
    this.w = 1024;
    this.h = 768;

    // actual screen size
    this.cview = document.getElementById('canvas');
    this.cw = this.cview.width = this.$('.canvas').width();
    this.ch = this.cview.height = this.$('.canvas').height();

    this.fxview = document.getElementById('fx');
    this.fxview.width = this.$('.fx').width();
    this.fxview.height = this.$('.fx').height();

    this.fitToView();

    this.start();

  }
});
