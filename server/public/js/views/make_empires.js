/*global Backbone:true, $:true, _:true, App:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */

App.Views.make_empires = Backbone.View.extend({
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

    var canvas = this;

    if(!this.running){
      return;
    }

    var ctx = this.cview.getContext('2d');
    var ctxfx = this.fxview.getContext('2d');

    ctx.save();
    ctxfx.save();

    ctxfx.fillStyle = 'rgba(1,1,1,.18)';
    ctxfx.fillRect(0,0, this.cw,this.ch);

    ctx.clearRect(0,0,this.cw,this.ch);

    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);

    ctxfx.translate(this.x, this.y);
    ctxfx.scale(this.scale, this.scale);


    // ctx.strokeStyle = '#c0c';
    // ctx.lineWidth = xw/64;
    // ctx.beginPath();
    // ctx.rect(0, 0, canvas.w, canvas.h);
    // ctx.closePath();
    // ctx.stroke();
    
    var xw = this.w/8;
    var xh = this.h/8;

    // draw here

    // scale for drawing elements within a system
    var scale = 0.3;
    var universe = this.universe;

    // ctxfx.strokeStyle = '#c0c';
    // ctxfx.lineWidth = 1;
    // ctxfx.beginPath();
    // ctxfx.rect(0, 0, this.w, this.h);
    // ctxfx.closePath();
    // ctxfx.stroke();

    universe.systems.each(function(system){

      var data = system.toJSON();

      // ctxfx.strokeStyle = '#c0c';
      // ctxfx.lineWidth = xw/128;
      // ctxfx.beginPath();
      // ctxfx.rect(data.x - (data.w/2 * scale), data.y - (data.h/2 * scale), data.w * scale, data.h * scale);
      // ctxfx.closePath();
      // ctxfx.stroke();

      // ctx.strokeStyle = '#888';
      // ctx.lineWidth = xw/64;
      // ctx.beginPath();
      // ctx.arc(data.x, data.y, data.radius* 0.1, 0, 2*Math.PI);
      // ctx.stroke();
      // ctx.closePath();

      ctx.save();
      ctx.scale(scale, scale);
      ctx.translate(data.x/scale - (data.w/2), data.y/scale - (data.h/2))

      ctxfx.save();
      ctxfx.scale(scale, scale);
      ctxfx.translate(data.x/scale - (data.w/2), data.y/scale - (data.h/2))

      // canvas.wx = data.w * 0.4 / 3;
      // canvas.wy = data.h * 0.4 / 3;

      // var x = (data.x * 4) - data.w * 1.3; 
      // var y = (data.y * 4) - data.h;
      
      // var sx = data.w / canvas.w;
      // var sy = data.h / canvas.h;
      // data.scale = Math.min(sx, sy);


      // data.x = (canvas.w / 2) - ((data.w * data.scale)/2);
      // data.y = (canvas.h / 2) - ((data.h * data.scale)/2);
       
      // ctx.translate(x, y); 
      // ctxfx.translate(x, y); 

      // ctxfx.strokeStyle = '#c0c';
      // ctxfx.lineWidth = xw/32;
      // ctxfx.beginPath();
      // ctxfx.rect(0, 0, canvas.w, canvas.h);
      // ctxfx.closePath();
      // ctxfx.stroke();

      var systemBorder = function(system){
        var data = system.toJSON();
        var colors = [];
        system.planets.each(function(planet){
          if(!planet.empire){
            colors.push(false);
            return;
          }
          colors.push(planet.empire.get('color'));
        });

        ctx.fillStyle = 'rgba(51,51,51,0.1)';
        ctx.strokeStyle = '#666';
        if(_.uniq(colors).length === 1 && colors[0]){
          // if this empire owns the whole system, draw it in their color
          ctx.strokeStyle = colors[0];
        }

        // ctx.strokeStyle = '#c0c';
        // ctx.lineWidth = xw/64;
        // ctx.beginPath();
        // ctx.rect(0, 0, data.w, data.h);
        // ctx.closePath();
        // ctx.stroke();

        //ctx.strokeStyle = '#888';
        ctx.lineWidth = xw/32;
        ctx.beginPath();
        ctx.arc(data.w/2, data.h/2, data.radius/2, 0, 2*Math.PI);
        ctx.stroke();
        ctx.closePath();
      }(system);


      var systemStars = function(system){

        ctx.strokeStyle = '#fff';

        system.stars.each(function(star){
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
      }(system);


      var draw_missiles = function(){
        for (var i in system.missiles) {
          var missile = system.missiles[i];
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


      var draw_booms = function(system){
        var boom;

        var xw = system.get('w')/16;
        var xh = system.get('h')/16;


        for (var i in system.booms) {
          boom = system.booms[i];
          boom.ttl --;
          if(boom.ttl < 0){
            system.booms.splice(i, 1);
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
      }(system);


      var draw_planet_arcs = function(system){
        system.planets.each(function(model){

          var planet = model.toJSON();

          ctx.strokeStyle = 'rgba(255,255,255,0.15);';
          var distance = G.distance (planet.x, planet.y, data.w/2, data.h/2);
          ctx.beginPath();
          ctx.arc(data.w/2, data.h/2, planet.r, 0, 2 * Math.PI, true);
          ctx.stroke();
          ctx.closePath();

        });
      }(system);
      
      var draw_planets = function(system){

        system.planets.each(function(planet){

          var w = system.get('w');
          var h = system.get('h') ;
          
          var data = planet.toJSON();

          ctx.fillStyle = '#fff';

          if(planet.empire){
            ctx.strokeStyle = planet.empire.get('color');
            ctx.fillStyle = planet.empire.get('color');
          }

          ctx.lineWidth = xw/32;
          ctx.beginPath();
          ctx.arc(data.x, data.y, Math.max(xw/6, xw/16 * data.size), 0, 2 * Math.PI, true);
          ctx.fill();
          ctx.closePath();

          var theta = G.angle (data.x, data.y, w/2, h/2);

          // dark side
          ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
          ctx.beginPath();
          ctx.arc(data.x, data.y, Math.max(xw/6, xw/16 * data.size), theta - (0.5*Math.PI), theta + (0.5*Math.PI), false);
          ctx.closePath();
          ctx.fill();

          // build %
          if(planet.empire){
            ctx.save();
            ctx.translate(data.x, data.y);
            var pctx = ((data.cr/data.shipcost)*100).toFixed(0);

            ctx.fillStyle = 'rgba(255,255,255, 0.2);';
            ctx.fillRect(-50, 0, 100, 8);
            ctx.fillText(0, yy*1, 20, 20);

            ctx.fillStyle = 'rgba(255, 0, 0, 0.7);';
            ctx.fillRect(0 - pctx/2, 0, pctx, 10);
            ctx.fillText(0, yy*1, 20, 20);
            ctx.restore();
          }

          var theta = G.angle (w/2, h/2, data.x, data.y) + Math.PI/2;
          ctx.save();
          ctx.translate(data.x, data.y);
          ctx.rotate(theta);
          var yy = xh * 0.6;

          planet.ships.each(function(ship, i){

            var x = xw/6 * data.size + (xw/6 * i);
            var y = 0;
            var z = xw / 16;

            var color = ship.empire.get('color');
            ctx.fillStyle = color;
            ctx.strokeStyle = color;

            ctx.save();
            ctx.translate(x, y);        
            ctx.rotate(Math.PI);
            
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -1.5*z);
            ctx.lineTo(z, z);
            ctx.lineTo(0, 0);
            ctx.lineTo(-z, z);
            ctx.lineTo(0, -1.5*z);
            ctx.closePath();     
            ctx.stroke();
            ctx.fill();
            ctx.restore();
          });
          ctx.restore();
        });
        
      }(system);



      var draw_ships = function(system){

        system.ships.each(function(ship){

          var data = ship.toJSON();

          var z = xw/8;

          var z = xw/8;

          ctx.fillStyle = ship.empire.get('color');
          ctx.strokeStyle = ship.empire.get('color');

          ctx.save();
          ctx.translate(data.x, data.y);        
          ctx.scale(0.5, 0.5);
          ctx.rotate(de_ra(data.a));

          ctxfx.save();
          ctxfx.translate(data.x, data.y);        
          ctxfx.scale(0.5, 0.5);
          ctxfx.rotate(de_ra(data.a));


          // hit
          if(data.hit){
            ctx.beginPath(); 
            ctx.fillStyle = '#fff';
            ctx.arc(0, 0, z*4, 0, 2 * Math.PI, true);
            ctx.closePath();     
            ctx.fill();

            ctxfx.beginPath(); 
            ctxfx.fillStyle = '#fff';
            ctxfx.arc(0, 0, z*4, 0, 2 * Math.PI, true);
            ctxfx.closePath();     
            ctxfx.fill();
          }

          // wedge
          ctx.lineWidth = z;
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
          ctx.lineWidth = z/4;
          ctx.strokeStyle = data.color;
          ctx.arc(0, 0, xw/2 * Math.max(0, (data.energy / data.energy_max)), 0, 2 * Math.PI, true);
          ctx.closePath();     
          ctx.stroke();
          
          ctx.restore();
          ctxfx.restore();


          // if shooting draw laser (not translated)
          if (data.laser) {
            ctx.lineWidth = xw/24;
            ctx.strokeStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(data.x, data.y);
            ctx.lineTo(data.laser_x, data.laser_y);
            ctx.closePath();     
            ctx.stroke();
            
            ctxfx.lineWidth = xw/32;
            ctxfx.strokeStyle = '#fff';
            ctxfx.beginPath();
            ctx.moveTo(data.x, data.y);
            ctxfx.lineTo(data.laser_x, data.laser_y);
            ctxfx.closePath();     
            ctxfx.stroke();
          }

        });
        
        
      }(system);


      // restore system render
      ctx.restore();
      ctxfx.restore();

    });



    var draw_jumplines = function(universe){
      // draw jumplines from source to target

      universe.ships.each(function(ship){

        if(!ship.origin_system || ! ship.target_system){
          return;
        }
        var data = ship.toJSON();

        if(!data.space_x || ! data.space_y){
          return;
        }

        var origin = ship.origin_system.toJSON();

        ctx.strokeStyle = 'rgba(255,255,255,0.2)'; //ship.empire.get('color');
        ctx.lineWidth = 8;


        ctx.beginPath();
        ctx.moveTo(origin.x, origin.y);
        ctx.lineTo(data.space_x, data.space_y);
        ctx.stroke();
        ctx.closePath();     

        var x = data.space_x; 
        var y = data.space_y;

        ctx.fillStyle = ship.empire.get('color');
        ctx.beginPath();
        ctx.arc(x, y, xw/16, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.closePath();     

      });

    }(universe);
    


    // //empire stats
    
    // var yy = xh/2;

    // ctx.font = 'bold 18pt arial';
    // ctx.fillStyle = '#888';
    // ctx.textAlign = 'center';
    // ctx.fillText('ships', 0.5 * xw, yy);
    // ctx.fillText('planets', 1 * xw, yy);
    // ctx.fillText('systems', 1.5 * xw, yy);

    // self.universe.empires.each(function(empire){
    //   yy += xh/4;
    //   ctx.fillStyle = empire.get('color');
    //   ctx.textAlign = 'center';
    //   ctx.fillText(empire.ships.length, 0.5 * xw, yy);
    //   ctx.fillText(empire.planets.length, 1 * xw, yy);
    //   ctx.fillText(empire.systems.length, 1.5 * xw, yy);

    //   // ctx.textAlign = 'left';
    //   // ctx.fillText(empire.get('name'), 4 * xw, yy);
    // });


    //

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



    //

    if(this.tickTimer){
      clearTimeout(this.tickTimer);
    }
    this.tickTimer = setTimeout(this.tick.bind(this), this.period);
  },
  init: function(){
    var self = this;

    this.universe = new App.Models.Universe({
      systemLimit: 7
    });
    this.universe.addEmpire({
      name: 'Meat Eaters',
      color: '#a0a'
    });

    this.universe.addEmpire({
      name: 'Criminal Element',
      color: '#cc0'
    });

    this.universe.addEmpire({
      name: 'The Blackness',
      color: '#0cc'
    });

    this.universe.addEmpire({
      name: 'Singapore',
      color: '#0f0'
    });

    this.universe.addEmpire({
      name: 'French Connetion',
      color: '#69c'
    });

    this.universe.addEmpire({
      name: 'Middle Earth',
      color: '#fc0'
    });

    this.period = 100;

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
