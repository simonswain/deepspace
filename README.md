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

## History

2014-11-25 0.0.1 Rough Cut