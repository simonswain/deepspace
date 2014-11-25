/*global Backbone:true, $:true, _:true, App:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */

App.Views.testpattern = Backbone.View.extend({
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

    if(!this.running){
      return;
    }

    var ctx = this.cview.getContext('2d');
    var ctxfx = this.fxview.getContext('2d');

    ctx.save();
    ctxfx.save();

    ctxfx.fillStyle = 'rgba(1,1,1,.05)';
    ctxfx.fillRect(0,0, this.cw,this.ch);

    ctx.clearRect(0,0,this.cw,this.ch);

    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);

    ctxfx.translate(this.x, this.y);
    ctxfx.scale(this.scale, this.scale);

    var xw = this.w/16;
    var xh = this.h/16;

    ctx.strokeStyle = '#044';
    ctx.lineWidth = 2;

    for (i=0; i<=this.w; i+=xw){
      // vert
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, this.h);
      ctx.stroke();
    }

    for (i=0; i<=this.h; i+=xh){
      // horiz
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(this.w, i);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.fillStyle = '#0ff';
    ctx.rect(this.sprite.x * xw, this.sprite.y * xh, xw, xh);
    ctx.fill();
    ctx.closePath();     


    ctxfx.beginPath();
    ctxfx.fillStyle = '#0ff';
    ctxfx.rect(this.sprite.x * xw, this.sprite.y * xh, xw, xh);
    ctxfx.fill();
    ctxfx.closePath();     

    ctx.restore();
    ctxfx.restore();

    // ctx.fillStyle = '#aaa';
    // ctx.font = '12pt arial';
    // ctx.textAlign = 'right';
    // ctx.fillText(this.sprite.x, 16, 16);
    // ctx.fillText(this.sprite.y, 16, 32);

    if(!this.running){
      return;
    }
    this.requestId = window.requestAnimationFrame(this.draw);

  },
  tick: function(){
    if(!this.running){
      return;
    }
    this.sprite.x ++;
    if(this.sprite.x > 15){
      this.sprite.x = 0;
      this.sprite.y ++;
      if(this.sprite.y > 15){
        this.sprite.y = 0;
      }
    }
    if(this.tickTimer){
      clearTimeout(this.tickTimer);
    }
    this.tickTimer = setTimeout(this.tick.bind(this), this.period);
  },
  init: function(){
    this.period = 25;
    this.sprite = {
      x: 0,
      y: 0
    };
  },
  start: function () {
    this.init();
    this.running = true;
    this.draw();
    setTimeout(this.tick.bind(this), this.period);
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
