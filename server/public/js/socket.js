/*global Backbone:true,  _:true, $:true, backbone:true, App:true */
/*jshint browser:true */
/*jshint strict:false */

App.Socket = Backbone.Model.extend({
  initialize: function(opts){
    _.bindAll(this,
              'watchdog','connect',
              'onopen','onmessage','onerror','onclose',
              'handle'
             );

    this.controller = opts.controller;

    this.ws = null;
    this.timer = null;

    this.connect();
    this.timer = setInterval(this.watchdog, 5000);

  },
  watchdog: function(){

    if(!this.ws){
      this.connect();
      return;
    }

    if(this.ws.readyState === 3){
      this.connect();
    }

  },
  connect: function(){

    if(this.ws && this.ws.readyState !== 3){
      return;
    }

    var uri;
    var l = window.location;
    uri = ((l.protocol === "https:") ? "wss://" : "ws://") + l.hostname + (((l.port !== 80) && (l.port !== 443)) ? ':' + l.port : '');

    this.ws = new WebSocket(uri);
    this.ws.onopen = this.onopen;
    this.ws.onerror = this.onerror;
    this.ws.onmessage = this.onmessage;
    this.ws.onclose = this.onclose;

  },
  onopen: function(){
    // identify ourselves with the token the server gave us over REST
    this.controller.set({'socket': true});
    //this.command(['all']);
  },
  command: function(command){
    // command = [method, ...arg, arg...]
    console.log('to >WS command', command);
    this.ws.send(JSON.stringify(command));
  },
  onmessage: function(e){
    var msg;
    try{
      msg = JSON.parse(e.data);
    } catch(err) {
      return;
    } finally {
      this.handle(msg);
    }
  },
  onerror: function(err){
    //console.log('socket err', err);
  },
  onclose: function(){
    //console.log('socket closed');
    this.controller.set({'socket': false});
  },
  handle: function(msg){
    console.log('from WS>',msg);
    var command = msg[0];
    var args = msg;
    args.shift();
    console.log(command);
  }

});
