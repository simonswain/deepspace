/*global Backbone:true, $:true, _:true, App:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */

App.Views.Default = Backbone.View.extend({
  template: _.template('<div class="canvas"></div><div class="fx"></div>\
<div class="home"><h1>Deep Space</h1>\
<ul class="toc">\
<% _.each(pages, function(x) { %><li><a href="<%= x[0] %>" class="<%= x[2] %>"><%= x[1] %></a><% }); %>\
</ul>\
<div class="keys">&larr; esc spc tab &rarr;</div>\
</div>'),
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

    var slideframe = ctxfx.getImageData(0, 0, this.cw, this.ch);
    ctxfx.putImageData(slideframe, 0, -1);

    ctxfx.fillStyle = 'rgba(1,1,1,.08)';
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
      ctxfx.beginPath();
      ctxfx.fillStyle = '#fff';
      ctxfx.arc(star.x, star.y, 1, 0, 2 * Math.PI, true);
      ctxfx.fill();
      ctxfx.closePath();
    });

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
    
    this.stars.forEach(function(star, i){
      star.ttl --;
      star.y += star.yv;
      if(star.ttl <= 0){
        self.stars.splice(i, 1);
      }     
    });

    while(this.stars.length < 100){
      this.stars.push({
        x: random0to(this.w),
        y: random0to(this.h),
        yv: random0to(20)/10,
        ttl: 10 + random0to(20)
      });
    }

    //

    if(this.tickTimer){
      clearTimeout(this.tickTimer);
    }
    this.tickTimer = setTimeout(this.tick.bind(this), this.period);
  },
  init: function(){
    var self = this;
    this.stars = [];

    this.period = 100;

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

    var data = {};

    var pages = App.index;

    data.pages = _.map(pages, function(x){
      x[2] = ''
      if(x[0] !== '' && App.Views.hasOwnProperty(x[0])){
        x[2] = 'available';
      }
      return x;
    });

    this.$el.html(this.template(data));
    
    this.$('.home').css({
      top: $(window).height()/2 - this.$('.home').height()/2
    });

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
