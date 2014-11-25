App.Models.Empire = Backbone.Model.extend({
  defaults: {
    id: null,
    name:'Unknown Empire',
    color:  '#c0c'
  },
  initialize: function() {
    _.bindAll(this, 'addSystem','removeSystem','addPlanet','removePlanet');
    this.planets = new App.Collections.Planets();
    this.systems = new App.Collections.Systems();
    this.ships = new App.Collections.Ships([]);
  },
  addSystem: function(system){
    if(this.system && this.system.empire){
      this.system.empire.removeSystem(this.system);
    }
    system.empire = this;
    this.systems.add([system]);
  },
  removeSystem: function(system){
    this.systems.remove(system);
    system.empire = null;
  },
  addPlanet: function(planet){
    //console.log(' + ' + this.get('name') + ' owns planet ' + planet.get('name'))
    if(this.planet && this.planet.empire){
      this.planet.empire.removePlanet(this.planet);
    }

    planet.empire = this;
    this.planets.add([planet]);

  },
  removePlanet: function(planet){
    this.planets.remove(planet);
    planet.empire = null;
  },
  addShip: function(ship){
    this.ships.add(ship);
  },
  removeShip: function(ship){
    this.ships.remove(ship);
  },


});
