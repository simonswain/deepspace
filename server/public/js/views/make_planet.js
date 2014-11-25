/*global Backbone:true, $:true, _:true, App:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */

App.Views.make_planet = Backbone.View.extend({
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

    ctxfx.fillStyle = 'rgba(1,1,1,.18)';
    ctxfx.fillRect(0,0, this.cw,this.ch);

    ctx.clearRect(0,0,this.cw,this.ch);

    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);

    ctxfx.translate(this.x, this.y);
    ctxfx.scale(this.scale, this.scale);

    var xw = this.w/16;
    var xh = this.h/16;

    // draw here

    var data = this.planet.toJSON();
    var radius = xh * 2;
    data.x = Number(3*xw);
    data.y = Number(3*xh);
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(data.x, data.y, radius, 0, 2 * Math.PI, true);
    ctx.closePath();
    ctx.fill();

    var segments = {
      pop: '#fff',
      pol: '#c00',
      ind: '#0cc',
      agr: '#090'
    };

    var oldAngle = 0;
    _.each(segments, function(color, k){
      var val = data[k] / data.land;
      if(k === 'pol'){
        val = data.land * (val/100);
      }
      var wedge = 2 * Math.PI * val;
      var angle = oldAngle + wedge;
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(data.x, data.y, radius, oldAngle, angle);
      ctx.lineTo(data.x, data.y);
      ctx.closePath();
      ctx.fill();
      oldAngle += wedge;
    });

    var segments = {
      pop: '#fff',
      pol: '#c00',
      agr: '#090',
      ind: '#0cc',
      cr: '#cc0'
    };
    var vals = [
      'land',
      'pop',
      // 'birthrate',
      // 'deathrate',
      'agr',
      'ind',
      'pol',
      'cr'
    ];
    var xl = xw;
    var xr = 6*xw;
    var xp = 9*xw;
    var xd = this.w - (4*xw);
    var xo = this.w - (xw);
    var yy = 8*xh;

    ctx.font = '32pt arial';

    ctx.fillStyle = '#aaa';
    vals.forEach(function(k){

      if(segments[k]){
        ctx.fillStyle = segments[k];
      }

      ctx.textAlign = 'left';
      ctx.fillText(k, xl, yy);

      var val = data[k];
      if(k === 'pol'){
        val = data.land * (val/100);
      }

      var pct = val / data.land * 100;

      var s;
      // deltas
      s = data['d_' + k]
      if(!s){
        s = 0;
      } else {
        s = s.toFixed(2);
      }

      if(data['d_' + k] === 0){
        s = '-';
      } else if(data['d_' + k] < 0){
        s = '-' + s;
      } else {
        s = '+' + s;
      }

     if(data.hasOwnProperty('d_' + k)){
        ctx.textAlign = 'right';
        ctx.fillText(s, xd, yy);
     }

     if(data.hasOwnProperty('d_' + k)){
        ctx.textAlign = 'right';
        ctx.fillText(s, xd, yy);
      }

      // outputs
      s = data['out_' + k]
      if(!s){
        s = 0;
      } else {
        s = s.toFixed(0);
      }
      if(data['out_' + k] === 0){
        s = '-';
      } else if(data['out_' + k] < 0){
        s = s;
      }

     if(data.hasOwnProperty('d_' + k)){
        ctx.textAlign = 'right';
        ctx.fillText(s, xo, yy);
      }

      ctx.textAlign = 'right';
      if(k === 'cr'){
        ctx.fillText(data[k].toFixed(2), xr, yy);
      } else {
        ctx.fillText(val.toFixed(2), xr, yy);
        ctx.fillText(pct.toFixed(2) + '%', xp, yy);
      }
      yy += xh;
    });

    // chart
    var drawChart = function(){
      var chart = self.chart;
      var w = xw*8;
      var h = xh*4
      ctx.save();
      ctx.translate(xw*6, xh);
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.rect(0, 0, w,h);
      ctx.fill();

      ctx.lineWidth = xw/16;

      _.each(self.chart, function(vals, key){
        ctx.strokeStyle = segments[key];
        var xstep = w /  self.chartLimit;
        ctx.beginPath();
        ctx.moveTo(0, h - (h * vals)[0]);
        vals.forEach(function(val, ix){
          ctx.lineTo(1+ ix * xstep, h - (h * val));
        });
        ctx.stroke();
        ctx.closePath();
      });

      ctx.beginPath();
      ctx.strokeStyle = '#444';
      ctx.rect(0, 0, w,h);
      ctx.stroke();

      ctx.restore();
    }();


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

    var data = this.planet.toJSON();
    _.each(['pop','pol','agr','ind'], function(key){
      var val = data[key];
      if(key === 'pol'){
        val = val/100; // val is %
      } else{
        // express as
        val = (val / data.land);
      }
      self.chart[key].push(val);
      while(self.chart[key].length > self.chartLimit+1){
        self.chart[key].shift();
      }
      //console.log(key, val);
    });
    //

    if(this.tickTimer){
      clearTimeout(this.tickTimer);
    }
    this.tickTimer = setTimeout(this.tick.bind(this), this.period);
  },
  init: function(){
    var self = this;
    this.chartLimit = 1000;
    this.chart = {
      pop: [],
      pol: [],
      agr: [],
      ind: []
    };

    this.planet = new App.Models.Planet({name: 'Test Planet'});
    this.period = 50;

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
    console.log('++');
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
