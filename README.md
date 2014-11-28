# Deep Space

Deep Space is a science fiction simulation.

It creates stars, planets, economies, empires and spaceships.

Ships leave their home planet, colonise ungoverned words and spread
their empires as far as possible.

Deep Space was first presented at JSConf.asia 2014. It is a study in
physics, economics and emergent behaviour. Scientific accuracy is
sacrificed to make an interesting sim.

You can see a demo in operation at [http://simonswain.com/deepspace](http://simonswain.com/deepspace).

## Install

I run this on Ubuntu 14.04 desktop. Only really in Chrome, but it seems to work OK in Firefox.

Seems to work fine on a mac with node installed using nvm.

This should get it installed:

```bash
git clone git@github.com:simonswain/deepspace.git
cd deepspace
cp config/index.sample.js config/index.js
npm install
bower install
node run
```

Will run on `localhost:3002`

## Key Control

* `space` advances to next slide
* `left` and `Right` arrows change slide
* `esc` returns to title / index page
* `tab` toggles options on some screens

## Screens

### Make Planet

Observe planet economy

### Make System

Create a star and `n` planets with non space capable economies.

### Make Ships

Create a star system and two empires that launch ships. Test Mode. No shooting.

### Make Fight

Create a star system and two empires that launch ships. Test Mode. Shooting.

### Make Colonies

Create a star system and one operational empire on a random planet.

### Make War

Create a star system and two operational empires that fight for dominance.

### Make Empires

Create a Sector and multiple competing empires.


## Reading and Viewing

* Traveller (science fiction adventure in the far future)
* Ian M Banks Culture novels
* Red Mars, Green Mars, Blue Mars
* Atari vector games (Major Havoc, Tempest)
* Williams arcade games (Defender, Robotron, Joust)
* Tron (1992)
* Wargames (1983)
* Starship Troopers (1997)

## History

2014-11-25 0.0.1 Rough Cut