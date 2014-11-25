# Deep Space


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



## History

2014-11-25 0.0.1 Rough Cut