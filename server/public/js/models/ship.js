App.Models.Ship = Backbone.Model.extend({
  defaults: {

    id: null,
    // ships spawn on planet
    state: 'planet',

    // initial intent is to load population
    intent: 'load',

    name:'Ship',
    boom: false,
    // in-system position and movement
    x: 0, // system x when in system
    y: 0, // system y when in system
    vx: 0, // system x velocity
    vy: 0, // system y velocity
    a: 0, // angle ship is facing when in system
    v: 0, // velocity
    pr: null, // orbital position radius when at planet
    pa: null, // oribital position angle when at planet

    space_x: null,
    space_y: null,

    pop: 0, //  how many population the ship is carrying
    max_pop: 3000,

    // vector away from planet cw or ccw
    rot: ((Math.random() > 0.5) ? 1 : -1),

    // attributes
    jump_speed: 1, // warp drive speed
    jump_range: 1, // warp drive range
    jump_pct: null, // % of jump complete
    thrust: 1, // grav drive power
    laser_power: 1, // laser power
    laser_range: 0.2 + random0to(10)/100, // laser range as fraction of system radius
    laser_accuracy: 5,
    laser: false, // laser firing?
    laser_x: null,
    laser_y: null,
    hit: false, // ship is hit? (for animation)
    missile: 0,
    energy_max: 200,
    energy: 200,
    recharge: 1, //rate of recharge
    power: 5,
    damage: 0,
    shield: 0
  },
  interval: 20,
  initialize: function(vals, opts) {
    _.bindAll(this,
              'run','runSpace','runPlanet','runSpace',
              'systemPhysics','leavePlanet','boom', 'prepJump', 'doJump','unJump'
             );


    var energy = 200 + random0to(200);
    this.set({
      id: uuid.v4(),
      jump_speed: random1to(5),
      jump_range: random1to(5),
      laser_accuracy: random1to(10),
      laser_power: random0to(20) + 5,
      power: random0to(5),
      thrust: 20 + random1to(50)/10,
      recharge: 1 + ( random1to(10) ) / 10,
      energy_max: energy,
      energy: energy
    });

    // ship belongs to this empire
    this.empire = opts.empire || false;

    // ship is in orbit at this planet (starts with birth planet)
    this.planet = opts.planet || false;

    // ship is in this system
    this.system = opts.system || false;

    this.target_planet = null;
    this.target_system = null;
    this.origin_system = null;

  },
  runPlanet: function(){
    // things to do when the ship is locked in orbit at a planet

    var data = this.toJSON();
    var ship = this;

    var planet;

    if(!ship.planet){
      return;
    }

    var planet = ship.planet;

    if(planet.empire === ship.empire){
      // load up some population

      var capacity = data.max_pop - data.pop;
      if(capacity > 0){
        var getpop = planet.takePop(capacity);
        ship.set('pop', data.pop + getpop);
      }

      // for demo mode
      if(planet.system && planet.system.get('enabled_easy_spawn')){
        ship.set('intent', 'fight');
        ship.leavePlanet();
        return;
      }

      if(ship.get('pop') >= ship.get('max_pop')){
        // ready to leave
        ship.set('intent', 'colonize');
        ship.leavePlanet();
        return;
      }
    }

    if(planet.empire !== ship.empire){

      // if there are any enemy ships in-system, leave the planet and
      // go fight them

      // how many enemies in the system
      var enemies;
      enemies = planet.system.ships.reduce(function(total, x){
        if(!x){
          return;
        }
        if(x.empire !== ship.empire){
          total ++;
        }
        return total;
      }, 0);

      friends = planet.system.ships.reduce(function(total, x){
        if(!x){
          return;
        }
        if(x.empire === ship.empire){
          total ++;
        }
        return total;
      }, 0);

      if(enemies > 0 && enemies >= friends){
        ship.leavePlanet();
        return;
      }

      // shoot at target planet to remove population
      if(planet.get('pop') > 0 && data.energy > data.energy_max * 0.2) {

        // laser uses energy
        ship.set('energy', data.energy - 1);
        planet.killPop(data.laser_power);

        // do some fx
        if(Math.random() < 0.25){
          planet.system.booms.push({
            x: planet.get('x'),
            y: planet.get('y'),
            type: 'takeover',
            color: ship.empire.get('color'),
            ttl: 10
          });
        }

      }

      // take over planet, consume all attacking ships and put their
      // pop on the planet

      if(planet.get('pop') === 0){
        planet.ships.each(function(x){
          if(x.empire == ship.empire){
            planet.set({
              pop: planet.get('pop') + x.get('pop')
            });
          }
          x.boom('nop');
        });

        // colonize dead planet
        if(planet.empire){
          planet.empire.removePlanet(planet);
        }

        ship.empire.addPlanet(planet);

        planet.system.booms.push({
          x: planet.get('x'),
          y: planet.get('y'),
          type: 'colonize',
          color: ship.empire.get('color'),
          ttl: 10
        });
        return;
      }

    }


  },
  runSystem: function(){

    // things to do when the ship is in a system
    var ship = this;

    // if enemy ships in system, then fight
    if(!ship.system){
      return;
    }

    // how many enemies in the system
    var enemies;
    enemies = ship.system.ships.reduce(function(total, x){
      if(!x){
        return;
      }
      if(x.empire !== ship.empire){
        total ++;
      }
      return total;
    }, 0);


    friends = ship.system.ships.reduce(function(total, x){
      if(!x){
        return;
      }
      if(x.empire === ship.empire){
        total ++;
      }
      return total;
    }, 0);

    // if enough friends fighting already, then do something else

    if(enemies && enemies > friends){
      ship.set({
        intent: 'fight'
      });
    } else if(enemies === 0 || enemies <= friends){

      if(ship.get('intent') === 'jump'){

        // nop
        return;
      }

      if(!ship.target_planet && ship.system.get('enabled_colonize')){

        var potentials;

        potentials = ship.system.planets.reduce(function(list, planet){
          if(!planet){
            return total;
          }
          if(planet.empire !== ship.empire){
            list.push(planet);
          }
          return list;
        }, []);

        // ship will thrust towards ship planet

        if(potentials.length > 0){
          ship.target_planet = potentials[random0to(potentials.length)];
          ship.set({
            'intent':'colonize'
          });
          return;
        }

        if(ship.system.ships.filter(function(x){
          return (x != ship && x.empire === ship.empire && x.get('intent') === 'patrol');
        }).length >= 1){

          // try and jump. if no suitable target then stay on patrol
          if(!ship.prepJump()){
            ship.set({
              intent: 'patrol'
            });
          }

        } else {
          // no potentials -- keep the system safe unless enough
          // friendlies patrolling? go out-system and colonize
          ship.set({
            intent: 'patrol'
          });
        }

      }
    }
    
    ship.systemPhysics();
    
  },
  prepJump: function(){

    var self = this;

    // select a target, and set jump intent to naviagte to the
    // outersystem

    if(this.get('intent') === 'jump'){
      return;
    }

    // only if there are other stars present
    if(!this.system.universe){
      return;
    }
    var targets = this.system.universe.systems.filter(function(system){

      var range = G.distance(self.system.get('x'), self.system.get('y'), system.get('x'), system.get('y'));

      if (system === self.system){
        return false;
      }

      if(range > self.system.universe.get('radius') * 0.8){
        return false;
      }

      // how many enemies in the system
      var enemies;
      enemies = system.ships.reduce(function(total, ship){
        if(!ship){
          return;
        }
        if(self.system.empire !== ship.empire){
          total ++;
        }
        return total;
      }, 0);

      var friends;
      friends = system.ships.reduce(function(total, ship){
        if(!ship){
          return;
        }
        if(self.system.empire === ship.empire){
          total ++;
        }
        return total;
      }, 0);
      
      var inbound;
      inbound = self.system.universe.ships.reduce(function(total, ship){
        if(!ship){
          return;
        }
        if(self.system.empire === ship.empire && ship.target_system === system){
          total ++;
        }
        return total;
      }, 0);
      
      if(enemies && friends && (friends + inbound)-1 > enemies){
        return false;
      }

      if(friends && (friends + inbound) > 2){
        return false;
      }

      return true;

    });

    var targetGroups = _.groupBy(targets, function(system){
      var state;

      var empty = system.planets.reduce(function(total, planet){
        if(!planet.empire){
          total ++;
        }
        return total;
      }, 0);

      var friend = system.planets.reduce(function(total, planet){
        if(planet.empire === self.empire){
          total ++;
        }
        return total;
      }, 0);

      var enemy = system.planets.reduce(function(total, planet){
        if(planet.empire && planet.empire !== self.empire){
          total ++;
        }
        return total;
      }, 0);

      if(empty === system.planets.length){
        return 'empty';
      }

      if(friend > 0 && enemy > 0 && friend + enemy === system.planets.length){
        return 'contested';
      }

      if(friend > 0 && friend < system.planets.length && enemy === 0){
        // partially owned
        return 'partial';
      }

      if(friend === system.planets.length){
        return 'friend';
      }

      if(enemy === system.planets.length){
        return 'enemy';
      }

      if(enemy > 0){
        return 'borderlands';
      }

      return 'mixed';

    });

    if(targetGroups.contested){
      // then partially occupied  systems (support our troops)
      targets = targetGroups.contested;
    } else if (targetGroups.partial){
      // continue to colonize partially owned systems
      targets = targetGroups.partial;
    } else if (targetGroups.empty){
      // then try and find an unowned system (colonize the wastelands)
      targets = targetGroups.empty;
    } else if(targetGroups.borderlands){
      // take enemy borderlands
      targets = targetGroups.borderlands;
    } else if (targetGroups.enemy) {
      // then try enemy systems (fight them at home)
      targets = targetGroups.enemy;
    } else {
      // nowhere to go, stay in system. bad luck
      return false;
    }
    var target = targets[random0to(targets.length)];

    this.target_system = target;
    this.origin_system = this.system;
    this.target_planet = null;
    this.set({
      intent: 'jump'
    });
    return true;
  },
  doJump: function(){
    // select a target, and set jump intent to naviagte to the
    // outersystem
    this.system.removeShip(this);
    this.system = null;
    this.set({
      state: 'space',
      intent: null,
      jump_pct: 0
    });
    this.origin_system.universe.addShip(this);
  },
  unJump: function(){
    // select a target, and set jump intent to naviagte to the
    // outersystem
    this.origin_system.universe.removeShip(this);

    // position on edge of system closest to origin system

    var theta = G.angle(this.target_system.get('x'), this.target_system.get('y'), this.origin_system.get('x'), this.origin_system.get('y'));

    var r = this.target_system.get('radius');
    var x = this.target_system.get('w')/2 - (r * Math.cos(theta));
    var y = this.target_system.get('h')/2 - (r * Math.sin(theta));

    this.system = this.target_system;
    this.target_system = null;
    this.origin_system = null;
    this.target_planet = null;

    this.set({
      state: 'system',
      intent: 'colonize',
      jump_pct: null,
      x: x,
      y: y
    });
    this.system.addShip(this);
  },
  runSpace: function(){
    // things to do when the ship is in deep space
    var ship = this;
    if(!ship.origin_system || ! ship.target_system){
      return;
    }

    var theta = G.angle(ship.target_system.get('x'), ship.target_system.get('y'), ship.origin_system.get('x'), ship.origin_system.get('y'));
    var range = G.distance(ship.target_system.get('x'), ship.target_system.get('y'), ship.origin_system.get('x'), ship.origin_system.get('y'));

    var pct = ship.get('jump_pct');
    pct  += 1;

    if(pct > 100){
      // unjump here
      pct = 100;
      this.unJump();
      return;
    }

    var dist = range * (1 - (pct/100));

    var space_x = ship.target_system.get('x') - (dist * Math.cos(theta));
    var space_y = ship.target_system.get('y') - (dist * Math.sin(theta));

    ship.set({
      jump_pct: pct,
      space_x: space_x,
      space_y: space_y
    });


  },
  boom: function(type, x, y){

    if(this.get('boom')){
      return;
    }

    if(!type){
      type = true;
    }

    if(!x){
      x = this.get('x')
    }

    if(!y){
      y = this.get('y')
    }

    this.set({
      x: x,
      y: y,
      boom: type,
      color: this.empire.get('color')
    });
    this.empire.ships.remove(this);

  },
  run: function(){

    var ship = this.toJSON();

    if(ship.boom){
      return;
    }

    var state = this.get('state');
    var intent = this.get('intent');

    ship.hit = false; // consumed by animation
    ship.laser = false;
    ship.laser_x = null;
    ship.laser_y = null;

    // basics
    ship.energy = ship.energy + ( ship.recharge * ( 1 - ( 1 / ship.energy_max ) * ship.damage ) );
    if ( ship.energy > ship.energy_max ) {
      ship.energy = ship.energy_max;
    }

    ship.damage = ship.damage - ship.recharge;

    if ( ship.damage < 0 ) {
      ship.damage = 0;
    }

    // ship is destroyed!
    if (ship.damage > ship.energy_max) {
      this.boom('ship');
      return;
    }


    this.set(ship);
    switch(state){
      case 'planet':
      this.runPlanet();
      break;

      case 'system':
      this.runSystem();
      break;

      case 'space':
      this.runSpace();
      break;
    }

  },

  enterSystem: function(system){
    this.system.universe.removeShip(this);
    this.system.addShip(this);
    this.system = system;
    this.set({state: 'system'});
  },

  leaveSystem: function(system){
    // this.system.removeShip(this);
    // this.system = null;
    // this.system.universe.addShip(this);
    // this.set({state: 'space'});
  },

  enterPlanet: function(planet){
    this.planet = planet;
    this.set({state: 'planet'});
    this.system.removeShip(this);
    this.planet.ships.add(this);
  },

  leavePlanet: function(){
    if(!this.planet){
      return;
    }
    if(this.planet.get('fake_empire')){
      this.planet.ships.remove(this);
      this.planet = null;
      return;
    }

    var system = this.planet.system;
    this.set({
      'x': this.planet.get('x'),
      'y': this.planet.get('y'),
      'state': 'system'
    });

    this.planet.ships.remove(this);
    this.planet = null;

    this.system = system;
    system.ships.add(this);
  },

  spacePhysics: function(){

    // universe manages this

  },

  systemPhysics: function(opts){

    if(this.get('boom')){
      return;
    }

    if(!this.system){
      return;
    }

    var ship = this;

    var data = ship.toJSON();

    var x, y, a, v, gx, gy, thrust, angle;
    var radius;
    radius = ship.system.get('radius');

    data.x = Number(data.x);
    data.y = Number(data.y);

    data.vx = Number(data.vx);
    data.vy = Number(data.vy);

    // star gravity
    ship.system.stars.each(
      function(star){

        var g, px, py, angle, vx, vy, tx, ty;

        px = star.get('x');
        py = star.get('y');

        // angle between ship and star
        var theta = G.angle (px, py, data.x, data.y);

        // distance between ship and star
        var r = G.distance (data.x, data.y, px, py);

        // force of gravity from stars on ship
        g = 300 * ( 5 / ( r * r ) )
        //g = 1000 * ( 50 / ( r * r ) )

        // max gravity
        if ( g > 1 ) {
          g = 1;
        }

        // convert gravity to xy. apply
        vx = g * Math.cos(theta);
        vy = g * Math.sin(theta);

        // thrust vector across star's pull
        angle = de_ra ( ra_de (theta) + (data.rot * 90) );
        var tx = (0.1 * data.thrust * g) * Math.cos(angle);
        var ty = (0.1 * data.thrust * g) * Math.sin(angle);
        data.vx = data.vx + vx + tx;
        data.vy = data.vy + vy + ty;
      });


    // // planet gravity
    ship.system.planets.each(
      function(planet){

        var g, px, py, angle, vx, vy, tx, ty;

        px = planet.get('x');
        py = planet.get('y');

        // angle between ship and planet
        var theta = G.angle (px, py, data.x, data.y);

        // distance between ship and planet
        var r = G.distance (data.x, data.y, px, py);

        if(r < 5){
          return;
        }
        // force of gravity from planets on ship
        g = 200 * ( 5 / ( r * r ) )

        // max gravity
        if ( g > 0.2 ) {
          g = 0.2;
        }

        // convert gravity to xy. apply
        vx = g * Math.cos(theta);
        vy = g * Math.sin(theta);
        // thrust vector across planet's pull
        if(ship.target_planet !== planet){
          angle = de_ra ( ra_de (theta) + (data.rot * 90) );
          tx = (0.05 * data.thrust * g) * Math.cos(angle);
          ty = (0.05 * data.thrust * g) * Math.sin(angle);
          data.vx = data.vx + vx + tx;
          data.vy = data.vy + vy + ty;
        }

      });

    // flocking with friends
    var separation = function(){

      ship.system.ships.each(function(model){

        var vx, vy;

        vx = 0;
        vy = 0;

        if(model.get('boom') === true){
          return;
        }

        // must be in system space
        if(model.get('state') !== 'system'){
          return;
        }

        if(model === ship){
          return;
        }

        // friendly
        if(model.empire !== ship.empire){
          return;
        }

        var other = model.toJSON();
        var range = G.distance (other.x, other.y, data.x, data.y);

        if(range > 0 && range < radius * 0.2){
          var angle = G.angle (other.x, other.y, data.x, data.y);
          vx -= 0.1 * data.thrust * Math.cos(angle) * (1/range);
          vy -= 0.1 * data.thrust * Math.sin(angle) * (1/range);
        }

        data.vx = data.vx + vx;
        data.vy = data.vy + vy;
      });
    }();

    // find closest smaller enemy and move towards it
    var chase = function(){
      var enemy = false;
      var closest = Infinity;
      ship.system.ships.each(function(model){

        var vx, vy;

        vx = 0;
        vy = 0;

        if(model.get('boom') === true){
          return;
        }

        // must be in system space
        if(model.get('state') !== 'system'){
          return;
        }

        if(model === ship){
          return;
        }

        // friendly
        if(model.empire === ship.empire){
          return;
        }

        // don't chase bigger enemies
        if(model.get('energy') > data.energy){
          return;
        }

        var range = G.distance (data.x, data.y, model.get('x'), model.get('y'));
        
        if(range < closest){
          closest = range;
          enemy = model;
        }
      });


      if(enemy){
        // vector aray at 45 degrees
        var other = enemy.toJSON();
        var angle = G.angle (other.x, other.y, data.x, data.y);
        angle = de_ra ( ra_de (angle) + (data.rot * 45) );
        if(closest > 0){
          vx = data.thrust * Math.cos(angle) * (1/closest);
          vy = data.thrust * Math.sin(angle) * (1/closest);
          data.vx = data.vx + vx;
          data.vy = data.vy + vy;
        }
      }

    }();


    // find closest smaller enemy and move towards it
    var flee = function(){

      var vx, vy;

      vx = 0;
      vy = 0;

      ship.system.ships.each(function(model){

        if(model.get('boom') === true){
          return;
        }

        // must be in system space
        if(model.get('state') !== 'system'){
          return;
        }

        if(model === ship){
          return;
        }

        // friendly
        if(model.empire === ship.empire){
          return;
        }

        // don't run from smaller enemies
        if(model.get('energy') < data.energy){
          return;
        }

        var range = G.distance (data.x, data.y, model.get('x'), model.get('y'));
        if(isNaN(range)){
          console.log(range, data.y, data.y, model.get('x'), model.get('y'));
        }
        // if too far away, don't worry
        if(range === 0 || range > radius * 0.2){
          return;
        }

        var other = model.toJSON();
        var angle = G.angle (data.x, data.y, other.x, other.y);
        vx += data.thrust * Math.cos(angle) * (1/range);
        vy += data.thrust * Math.sin(angle) * (1/range);

      });

      data.vx = data.vx + vx;
      data.vy = data.vy + vy;

    }();

    var force_center = function(){

      // distance from center of system. turn back towards center
      // proportional to distance. at system radius, should be facing
      // system center

      var range = G.distance (data.x, data.y, ship.system.get('w')/2, ship.system.get('h')/2);
      var theta = G.angle (ship.system.get('w')/2, ship.system.get('h')/2, data.x, data.y);

      // create force proportional to distance from cenetr
      var f = (range / radius);

      // max force
      // convert force to xy vector and apply
      data.vx = data.vx + (f * Math.cos(theta));
      data.vy = data.vy + (f * Math.sin(theta));

    }();


    //find enemy ships and attack
    var attack = function(){

      if(data.intent !== 'fight'){
        return;
      }

      if(!ship.system.get('enabled_fight')){
        return;
      }

      if(data.energy < data.energy_max * 0.1){
        return;
      }

      if(Math.random() > 0.25){
        return
      }

      data.laser = false;
      data.laser_x = null;
      data.laser_y = null;

      var enemy = {
        data: false,
        range: Infinity
      };


      ship.system.ships.each(function(model){

        var other, theta, range;

        if(data.laser){
          return;
        }

        if(model.get('boom') === true){
          return;
        }

        // must be in system space
        if(model.get('state') !== 'system'){
          return;
        }

        // friendly
        if(model.empire === ship.empire){
          return;
        }

        // attach closest enemy
        
        var other = model.toJSON();
        var theta = G.angle (data.x, data.y, other.x, other.y);
        var range = G.distance (other.x, other.y, data.x, data.y);
        if(range < enemy.range && range < (1.3 * radius * data.laser_range)){
          enemy = {
            range: range,
            model: model,
            data: other
          }
        }
      });

      if(enemy) {
        other = enemy.data;
        // laser uses energy
        data.energy = data.energy - 1;
        data.laser = true;
        var f = ( random1to(2) === 1 ) ? -1 : 1;
        data.laser_x = other.x + ( f * random1to( 20 - data.laser_accuracy ) );
        data.laser_y = other.y + ( f * random1to( 20 - data.laser_accuracy ) );
        if (G.distance (data.laser_x, data.laser_y, other.x, other.y) < radius / 10 ) {
          enemy.model.set({
            hit: true,
            energy: Math.max(0, other.energy - data.laser_power * 1.0),
            damage: other.damage + data.laser_power
          });
        }
      }

    }();


    var fire_missile = function(){

      if(data.intent !== 'fight'){
        return;
      }

      if(!ship.system.get('enabled_fight')){
        return;
      }

      if(random1to(1500) > 20) {
        return;
      }

      data.laser = false;
      data.laser_x = null;
      data.laser_y = null;

      var enemies = ship.system.ships.filter(function(model){
        // friendly?
        return(model.empire !== ship.empire);
      });

      if(enemies.length === 0){
        return;
      }

      var enemy = enemies[random0to(enemies.length-1)];

      var missile = {
        x: data.x,
        y: data.y,
        v: 20 + random1to(20)/100,
        target: enemy,
        ttl: 50 + random1to(50)
      };

      ship.system.addMissile(missile);

    }();


    var target_planet = function(){

      if(data.intent === 'fight'){
        return;
      }

      if(!ship.target_planet){
        return;
      }

      var planet = ship.target_planet;

      // already colonized?
      if(planet.empire === ship.empire){
        ship.target_planet = false;
        return;
      }

      // how many enemies in the system
      var enemies;
      enemies = ship.system.ships.reduce(function(total, x){
        if(!x){
          return;
        }
        if(x.empire !== ship.empire){
          total ++;
        }
        return total;
      }, 0);

      // don't mess with the planet if there aren enemies in-system
      if(enemies > 0){
        return;
      }

      var theta = G.angle (planet.get('x'), planet.get('y'), data.x, data.y);
      data.vx += (0.05 * data.thrust) * Math.cos(theta);
      data.vy += (0.05 * data.thrust) * Math.sin(theta);
      var range = G.distance (planet.get('x'), planet.get('y'), data.x, data.y);

      // if in range, go in to orbit and try to take over planet
      if(range < (radius * 0.05)) {
        ship.enterPlanet(planet);
        return;
      }
    }();

    var jumpzone = function(){
      var theta = G.angle (ship.system.get('w')/2, ship.system.get('h')/2, data.x, data.y) + Math.PI;
      data.vx += (.5 * data.thrust) * Math.cos(theta);
      data.vy += (.5 * data.thrust) * Math.sin(theta);
      var range = (ship.system.get('w')/2, ship.system.get('h')/2, data.x, data.y);
      //if(range > ship.system.get('radius') * 0.4){
      ship.doJump();
      //}
    };



    if(data.intent === 'jump'){
      // fly to jump safe area (outer system)
        ship.doJump();
      //jumpzone();
    }

    // // ship thrust based on intent

    // // console.log(angle, thrust);
    // if(data.intent === 'jump'){
    //   // thrust away from planet to get to edge of system
    //   angle = de_ra ( ra_de (theta) + 180 );
    //   ship.vx = ship.vx + (0.5 * data.thrust) * Math.cos(angle);
    //   ship.vy = ship.vy + (0.5 * data.thrust) * Math.sin(angle);
    // }

    // damping
    data.vx = data.vx * 0.92;
    data.vy = data.vy * 0.92;

    // angle ship is facing from movement vector
    data.a = ra_de ( G.angle ( 0, 0, data.vx, data.vy ) ) - 90;

    if(isNaN(data.vx)){
      data.vx = 0;
    }

    if(isNaN(data.vy)){
      data.vy = 0;
    }

    data.x = Number(data.x) + Number(data.vx);
    data.y = Number(data.y) + Number(data.vy);

    // stay in system bounds
    if(ship.system){
      if ( data.x < 0 ) {
        data.x = 0;
      }

      if ( data.x > ship.system.get('w') ) {
        data.x = ship.system.get('w');
      }

      if ( data.y < 0 ) {
        data.y = 0;
      }

      if ( data.y > ship.system.get('h') ) {
        data.y = ship.system.get('h');
      }
    }

    ship.set({
      x: data.x,
      y: data.y,
      vx: data.vx,
      vy: data.vy,
      a: data.a,
      laser: data.laser,
      laser_x: data.laser_x,
      laser_y: data.laser_y
    });
  },

  planetPhysics: function(){
    // orbit, space evenly with other ships in orbit
  },

});

var G = {
  angle: function  ( x1, y1, x2, y2 ) {
    var x = x1 - x2;
    var y = y1 - y2;
    return Math.atan2(y,x);
  },
  distance: function ( x1, y1, x2, y2 ) {
    var x = Math.abs(x1-x2);
    var y = Math.abs(y1-y2);
    return Math.sqrt( (x*x) + (y*y) );
  },
}

function ra_de(r) {
  return r*(180/Math.PI);
}

function de_ra(d) {
  var pi = Math.PI;
  return (d)*(pi/180);
}
