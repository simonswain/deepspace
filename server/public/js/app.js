/*global Backbone:true,  _:true, $:true, App:true */
/*jshint browser:true */
/*jshint strict:false */

$(function(){
  App.start();
});

Backbone.View.prototype.close = function(){
  this.stopListening();
  if (this.onClose){
    this.onClose();
  }
  this.remove();
};

var App = {
  Models: {},
  Collections: {},
  Views: {},
  start: function(){
    this.mount = window.MOUNT;
    this.controller = new App.Models.Controller({
    });

    this.router = new App.Router();

    this.views = {
      app: new App.Views.App({
        controller: this.controller
      })
    };

    Backbone.history.start({pushState: true});

    $(document).on("click", "a:not([data-bypass])", function(e) {
      var href = $(this).attr("href");
      var protocol = this.protocol + "//";
      if (href.slice(0, protocol.length) !== protocol) {
        e.preventDefault();
        App.router.navigate(href, true);
      }
    });
  }
};


App.index = [
  ['testpattern', 'Test Pattern'],
  ['make_planet', 'Make Planet'],
  ['make_system', 'Make System'],
  ['make_ships', 'Make Ships'],
  ['make_fight', 'Make Fight'],
  ['make_colonies', 'Make Colonies'],
  ['make_war', 'Make War'],
  ['make_empires', 'Make Empires'],
];

App.Router = Backbone.Router.extend ({
  routes: {
    "": "default",
    ":view": "view",
    ":foo/:view": "view2",
    "*default": "default"
  },

  setView: function(view, id){
    if(!id){
      id = null;
    }
    App.controller.set({
      view: view,
      view_id: id
    });
  },

default: function() {
  this.setView('default');
},

  view: function(view) {
    console.log('router', view);
    this.setView('view', view);
  },

  view2: function(foo, id) {
    this.setView('view', id);
  }

});
