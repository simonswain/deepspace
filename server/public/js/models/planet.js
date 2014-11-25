App.Models.Planet = Backbone.Model.extend({
  defaults: {
    name:'Unknown Planet',
    age: 0,
    interval: 100,
    x: 0,
    y: 0,
    r: 0, // orbit radius
    a: 0, // orbit angle
    v: 0.0001, //orbital velocity in degrees
    size: 1, // size for drawing
    
    land: 1000, // available area
    agr: 0,
    agr_max: 0,
    pop: 0,
    birthrate: 0.002, //( 50 + random0to(50)) * 0.0005,
    deathrate: 0.001,
    popup: 500 + random0to(200) * 0.0030,
    indup: 500 + random0to(200) * 0.0030,
    agrup: 250 + random0to(200) * 0.15,
    shipcost: 5000,
    //
    pol: 0,
    ind: 0,
    cr: 1000,

    // deltas from last tick
    d_pop: 0,
    d_agr: 0,
    d_ind: 0,
    d_pol:0,
    d_cr:0,

    out_agr: 0,
    out_ind: 0,

    fake_empire: false
  },
  initialize: function(opts) {

    var self = this;

    opts = opts || {};

    this.system = opts && opts.system || null;
    this.empire = null;
    this.ships = new App.Collections.Ships([]);

    _.bindAll(this, 'run', 'physics','takePop','spawnShip','addShip','removeShip');

    var r, a, v, rr;
    r = 0;
    a = 0;
    v = 0;

    if(this.system){

      var spacing = this.system.get('radius') * 0.01;

      var gen = function(){
        var rr = self.system.get('radius');
        var r = ((0.05 * rr) + (0.41 * random.from0to(rr))).toFixed(2);
        return r;
      };

      if(this.system.planets.length === 0){
        r = gen();
      }
      a = random.from0to(360),
      //v = 0.001 + (random.from0to(100)/10000);
      v = 0.0001 * (25 + random.from0to(75));

      var ok = false;
      while (this.system.planets.length > 0 && !ok){
        ok = true;
        r = gen();
        this.system.planets.each(function(p){
          var dd = Math.abs(p.get('r') - r);
          if (dd < spacing){
            ok = false;
          }
        });
      }
    }


    var land = 10000 * random.from1to(5);
    var agr = (15 + random.from1to(25)) * land/100;
    var agr_max = agr;
   

    this.set({
      id: uuid.v4(),
      r: r,
      a: a,
      v: v,
      pop: (15 + random.from1to(25)) * land/100,
      agr: agr,
      agr: agr_max,
      ind: (5 + random.from1to(5)) * land/100,
      pol: 0,
      size: 2 + random.from0to(3),
      land: land,
      cr: 1000,
      shipcost: 2500 + random0to(2500)
    });

    //console.log(this.toJSON());

    this.rules = [
      'POP IND AGR POL <= SIZ',
      'POP <+ birthrate',
      'POP <- deathrate',
      'POP <= AGR',
      'IND.out ~ POP',
      'IND +> POL',
      'POL +~> deathrate',
      'IND %+> AGR',
      'IND gen Ships',
      'Ship takes POP',
    ];


    this.timer = false;
    this.run();
  },
  run: function(){

    var self = this;

    this.ships.each(function(ship){
      if(!ship){
        return;
      }
      if(ship.get('boom')){
        self.ships.remove(ship);
      }
      ship.run();
    });

    this.physics();

    var data = this.toJSON();

     var sum = data.pop + data.pol + data.agr + data.ind;
    //console.log('shrink', data.land, sum);
    if(sum > data.land){
      data.pop *= 0.95;
      data.ind *= 0.95;
      data.agr *= 0.95;
    }

    // pollution recovery
    data.pol = data.pol * 0.90;

    // // // births and deaths
    // var births = data.pop * (data.birthrate/100 * (50 + random.from1to(50)));
    // var deaths = data.pop * (data.deathrate/100 * (50 + random.from1to(50)));

    // deaths += 0.5 * data.pop * (data.pol/100);
    // //data.pop += Number(births) + Number(deaths);

    data.pop += data.popup;

    // // pop consumes agr
    data.agr -= data.pop * 0.0005;

    // // pol kills agr
    data.agr -= data.pol;

    if(data.agr > data.pop){
      data.agr = data.pop;
    }

    // // agr up
    data.agr += data.agrup;
    
    // // ind up
    data.ind += data.indup;
    data.ind += data.pop * 0.01;

    // // ind improves agr
    // data.agr += data.ind * 0.002;

    // // pollution from % of planet covered in ind and pop
    data.pol += ((data.ind + data.pop) / data.land)  * 1;

    if(data.ind > data.pop * 0.95){
      data.ind *= 0.90;
    }

    // if(data.agr > data.land * 0.5){
    //   //data.agr = data.agr * 0.90;
    // }

    // if(data.pop > data.agr * 0.95){
    //   data.pop = data.pop * 0.98;
    // }

    // // if(data.agr < data.land * 0.05){
    // //   data.agr = data.land * 0.1;
    // // }

    // if (data.pol >= 100){
    //   data.pol = 100;
    // }


    // // use tech to increase efficiency

    // // pollution reduces ag output
    // data.out_agr = data.agr/2 * (1 - (data.pol/100));


    //if(true || this.empire || this.get('fake_empire')){
      // Calculate earnings from planet
      //var earnings = ((data.ind / 1000) * (data.pop / 1000)) * ((50 + random0to(50))/100);
      var earnings = (data.ind/100 +data.pop/100) * ((50 + random0to(50))/100);

      data.d_cr = earnings;
      data.cr += earnings;
  //}

    data.age ++;

    // enough credit spawns ships to carray away pop

    this.set(data);
    if(this.empire || data.fake_empire){

      // wrap in check for system so planet can be simmed in isolation

      if(this.system && this.system.get('enabled_easy_spawn')){
        this.spawnShip();
      }

      //this.spawnShip();
      if(this.get('cr') > this.get('shipcost')){
        this.spawnShip();
      }

    }

    this.timer = setTimeout(this.run, this.get('interval'));
  },
  takePop: function(max){
    // up to 10% of pop, or max
    var pop = Math.floor(this.get('pop') * 0.025);
    pop = Math.min(pop, max);
    this.set('pop', this.get('pop') - pop);
    return pop;
  },
  killPop: function(n){
    var pop = this.get('pop').toFixed(0);
    var before = pop;
    var kill = n*50;

    pop = Math.max(0, pop - kill);
    if(pop<0){
      pop = 0;
    }
    this.set({'pop': pop});
  },
  physics: function(){

    if(!this.system){
      return;
    }

    var a, r, v, x, y, rr;

    rr = this.system.get('radius');
    var w = this.system.get('w');
    var h = this.system.get('h');

    a = this.get('a');
    r = this.get('r');
    v = this.get('v');

    a += v;
    a = a % 360;

    x = ((w/2) + r * Math.cos(a)).toFixed(2);
    y = ((h/2) + r * Math.sin(a)).toFixed(2);

    this.set({
      a: a,
      x: x,
      y: y
    });

  },
  addShip: function(ship){
    this.ships.add(ship);
  },

  removeShip: function(ship){
    this.ships.remove([ship]);
  },
  spawnShip: function(){

    var self = this;

    // use the money no matter what
    this.set({
      cr: this.get('cr') - this.get('shipcost')
    });

    if(this.get('pop') < 2000){
      return;
    }

    if(this.ships.length > 0){
      console.log('nospawn');
      return;
    }

    if(this.system){
      var friends = this.system.ships.filter(function(x){
        return (x.empire === self.empire);
      });
      
      if(friends.length > self.system.get('max_empire_ships')){
        return;
      }
    }

    // calculate desired ship
    
    //console.log(' @ Spawn ' + this.system.get('name') + ':' + this.get('name') + ':' + this.empire.get('name'));
    
    var ship = new App.Models.Ship({
      state: 'planet',
      x: this.get('x'),
      y: this.get('y')
    }, {
      empire: this.empire,
      planet: this
    });

    // add to planet's ships
    this.addShip(ship);

    if(this.get('fake_empire')){
      return;
    }

    // add to planets empire
    this.empire.addShip(ship);
    
  }
});
