/*global Backbone:true, $:true, _:true, App:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */

App.Views.make_fight = Backbone.View.extend({
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

    ctxfx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctxfx.fillRect(0,0, this.cw,this.ch);

    ctx.clearRect(0,0,this.cw,this.ch);

    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);

    ctxfx.translate(this.x, this.y);
    ctxfx.scale(this.scale, this.scale);

    var xw = this.w/16;
    var xh = this.h/16;

    // draw here

    var systemBorder = function(){
      var colors = [];
      self.system.planets.each(function(planet){
        if(!planet.empire){
          colors.push(false);
          return;
        }
        colors.push(planet.empire.get('color'));
      });

      ctx.strokeStyle = '#888';
      if(_.uniq(colors).length === 1 && colors[0]){
        // if this empire owns the whole system, draw it in their color
        ctx.strokeStyle = colors[0];
      }

      var r = Math.min(self.w, self.h);
      ctx.lineWidth = xw/32;
      ctx.beginPath();
      ctx.arc(self.w/2, self.h/2, r/2, 0, 2 * Math.PI, true);
      ctx.stroke();
      ctx.closePath();
    }();

    var draw_missiles = function(){
      for (var i in self.system.missiles) {
        var missile = self.system.missiles[i];
        //console.log(missile);
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(missile.x, missile.y, xw/24, 0, 2 * Math.PI, true);
        ctx.fill();

        ctxfx.fillStyle = '#888';
        ctxfx.beginPath();
        ctxfx.arc(missile.x, missile.y, xw/24, 0, 2 * Math.PI, true);
        ctxfx.fill();
      }
    }();


    var draw_booms = function(){
      var boom;
      for (var i in self.system.booms) {
        boom = self.system.booms[i];
        boom.ttl --;
        if(boom.ttl < 0){
          self.system.booms.splice(i, 1);
          continue;
        }

        boom.x = Number(boom.x);
        boom.y = Number(boom.y);

        ctxfx.fillStyle = boom.color;
        ctxfx.strokeStyle = boom.color;

        if(boom.type && boom.type == 'nop'){
        }

        if(!boom.type || boom.type == 'missile'){
          ctxfx.beginPath();
          ctxfx.arc(boom.x, boom.y, xw/2, 0, 2 * Math.PI, true);
          ctxfx.fill();
          ctxfx.closePath();
          ctxfx.stroke();
        }

        if(boom.type && boom.type === 'ship'){
          ctxfx.lineWidth = xw/64;
          ctxfx.beginPath();
          ctxfx.arc(boom.x, boom.y, ((20 - boom.ttl) * xw/16), 0, 2 * Math.PI, true);
          ctxfx.closePath();
          ctxfx.stroke();
        }       

        if(boom.type && boom.type === 'takeover'){
          ctxfx.lineWidth = xw/32;
          ctxfx.beginPath();
          ctxfx.rect(boom.x - xh, boom.y - xh, xh * 2, xh * 2);
          ctxfx.closePath();
          ctxfx.stroke();
        }       

        if(boom.type && boom.type == 'colonize'){
          ctxfx.lineWidth = xw/32;
          ctxfx.beginPath();
          ctxfx.arc(boom.x, boom.y, xw, 0, 2 * Math.PI, true);
          ctxfx.closePath();
          ctxfx.stroke();
        }

        if(!boom.type || boom.type == 'boom'){
          ctxfx.beginPath();
          ctxfx.arc(boom.x, boom.y, xw, 0, 2 * Math.PI, true);
          ctxfx.fill();
          ctxfx.closePath();
          ctxfx.stroke();
        }
      }
    }();


    self.system.stars.each(function(star){
      var data = star.toJSON();
      ctx.fillStyle = data.color;
      ctx.strokeStyle = data.color;
      var p = 12;
      var r = data.size * xw/24;
      var m = 0.7;
      ctx.save();
      ctx.beginPath();
      ctx.translate(data.x, data.y);
      ctx.moveTo(0,0-r);
      for (var i = 0; i < p; i++) {
        ctx.rotate(Math.PI / p);
        ctx.lineTo(0, 0 - (r*m));
        ctx.rotate(Math.PI / p);
        ctx.lineTo(0, 0 - r);
      }
      ctx.fill();
      ctx.restore();
    });

    self.system.planets.each(function(planet){
      var data = planet.toJSON();

      var rr = G.distance (data.x, data.y, self.w/2, self.h/2);
      ctx.strokeStyle = 'rgba(255,255,255,0.15);';
      ctx.lineWidth = xw/32;
      ctx.beginPath();
      ctx.arc(self.w/2, self.h/2, rr, 0, 2 * Math.PI, true);
      ctx.stroke();
      ctx.closePath();


      data.x = Number(data.x);
      data.y = Number(data.y);

      var theta = G.angle (data.x, data.y, self.w/2, self.h/2);

      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#fff';

      if(planet.empire){
        ctx.strokeStyle = planet.empire.get('color');
        ctx.fillStyle = planet.empire.get('color');
      }

      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(data.x, data.y, Math.max(xw/6, xw/16 * data.size), 0, 2 * Math.PI, true);
      ctx.fill();
      ctx.stroke();

      // dark side
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.arc(data.x, data.y, Math.max(xw/6, xw/16 * data.size), theta - (0.5*Math.PI), theta + (0.5*Math.PI), false);
      ctx.closePath();
      ctx.fill();

      var theta = G.angle (self.w/2, self.h/2, data.x, data.y) + Math.PI/2;
      ctx.save();
      ctx.translate(data.x, data.y);
      ctx.rotate(theta);
      var yy = xh * 0.6;

      ctx.restore();

    });

    // ships

    self.system.ships.each(function(ship){

      if(ship.get('boom')){
        return;
      }

      var data = ship.toJSON();
      var z = xw / 16;
      var color = ship.empire.get('color');
      ctx.fillStyle = color;
      ctx.strokeStyle = color;

      ctx.save();
      ctx.translate(data.x, data.y);        
      ctx.rotate(de_ra(data.a));

      ctxfx.save();
      ctxfx.translate(data.x, data.y);        
      ctxfx.rotate(de_ra(data.a));
      // // hit

      if(data.hit){
        ctx.beginPath(); 
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4);';
        ctx.arc(0, 0, z*4, 0, 2 * Math.PI, true);
        ctx.closePath();     
        ctx.fill();

        ctxfx.beginPath(); 
        ctxfx.fillStyle = '#fff';
        ctxfx.arc(0, 0, z*4, 0, 2 * Math.PI, true);
        ctxfx.closePath();     
        ctxfx.fill();
        //ship.set({'hit': false});
      }

      ctx.lineWidth = z/2;
      ctx.fillStyle = data.color;
      ctx.strokeStyle = data.color;
      ctx.beginPath();
      ctx.moveTo(0, -1.5*z);
      ctx.lineTo(z, z);
      ctx.lineTo(0, 0);
      ctx.lineTo(-z, z);
      ctx.lineTo(0, -1.5*z);
      ctx.closePath();     
      ctx.stroke();
      ctx.fill();
 
      // shield
      ctx.beginPath(); 
      ctx.lineWidth = z/2;
      ctx.strokeStyle = color;
      ctx.arc(0, 0, xw/4 * Math.max(0, (data.energy / data.energy_max)), 0, 2 * Math.PI, true);
      ctx.closePath();     
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 10pt arial';

      //ctx.fillText(ship.get('intent'), 0, -xh/2);

      ctx.fillText( ((ship.get('energy')/ship.get('energy_max'))*100).toFixed(0), 0, xh/2);

      ctx.restore();
      ctxfx.restore();

      // if shooting draw laser (not translated)
      if (data.laser) {
        ctx.lineWidth = xw/32;
        ctx.strokeStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(data.x, data.y);
        ctx.lineTo(data.laser_x, data.laser_y);
        ctx.closePath();     
        ctx.stroke();

        // ctxfx.lineWidth = xw/32;
        // ctxfx.strokeStyle = '#fff';
        // ctxfx.beginPath();
        // ctxfx.moveTo(data.x, data.y);
        // ctxfx.lineTo(data.laser_x, data.laser_y);
        // ctxfx.closePath();     
        // ctxfx.stroke();
      }

    });

    ctx.restore();
    ctxfx.restore();

    this.requestId = window.requestAnimationFrame(this.draw);

  },
  tick: function(){

    var self = this;

    if(!this.running){
      return;
    }

    // tick here

    if(this.tickTimer){
      clearTimeout(this.tickTimer);
    }
    this.tickTimer = setTimeout(this.tick.bind(this), this.period);
  },
  toggle: function(){
    if(this.system.get('max_empire_ships') !== 1){
      this.system.set({'max_empire_ships': 1});
    } else {
      this.system.set({'max_empire_ships': 10});
    }
  },
  init: function(){
    var self = this;

    this.booms = [];
   
    this.system = new App.Models.System({
      planetCount: 5,
      w: this.w,
      h: this.h,
      radius: Math.min(this.w, this.h),
      max_empire_ships: 1,
      enabled_easy_spawn: true,
      enabled_fight: true,
      enabled_colonize: false
      
    });

    var empire;
    this.empires = new App.Collections.Empires([]);

    empire = new App.Models.Empire({
      name: 'Meat Eaters',
      color: '#c0c'
    });
    this.empires.add(empire);
    empire.addPlanet(this.system.planets.at(0));
    //this.system.planets.at(0).empire = empire;

    empire = new App.Models.Empire({
      name: 'Criminal Element',
      color: '#0cc'
    });
    this.empires.add(empire);
    empire.addPlanet(this.system.planets.at(1));

    this.period = 1000;

  },
  start: function () {
    this.init();
    this.running = true;
    this.draw();
    setTimeout(this.tick.bind(this), this.period);
    //setInterval(this.init.bind(this), 20000);

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
