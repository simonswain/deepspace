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
  
  // all animations auto start, auto add, auto restart after xx seconds

  // We are going to look at how simple rules can make complex things

  ['testpattern', 'Test Pattern'],
  //['emergence', 'Emergence'],
  ['make_planet', 'Make Planet'],
  

  // ['rules_of_ships', 'Rules of Ships'], // Show single ship. JS object illustrate params
  // //['ship_behaviour', 'Make the ship behave'], // Chase, run, laser, missile
  // ['fighting_ships', 'Fighting Ships'], // in the orbiting planets

  // planet, orbit and outer system ownership??
  // Ships have a motivation to comquer, colonize or trade
  // colonization
  // Lets make some space
 
  ['make_system', 'Make a System'],
  ['make_ships', 'Make Ships'],
  ['make_fight', 'Make Fight'],
  ['make_colonies', 'Make Colonies'], // colonize! one empire
  ['make_war', 'Make War'], // colonize! two empires
  ['make_empires', 'Make Empires'], // take over the stars

  // //['make_stars', 'Make Stars'], 
  // // random starfield. Auto zoom, pan (pick system at random, easing), different density on randomisation; explain spacing algorithm. 'next' key zooms in to a star as lead in to next slide
  
  // ['make_universe', 'Make A Univese'] // big starfield zooming in/out
  // // of random stars, almost looking
  // // like Life (fake zooming in to systems)

// how to run serverside and across multiple machines (theory and challenge)
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
