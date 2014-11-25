"use strict";

var fs = require('fs');
var _ = require('underscore');
var async = require('async');
var Hapi = require('hapi');
var Path = require('path');

module.exports = function(config){

  config = config || {};
 
  if(!config.hasOwnProperty('server')){
    config.server = {
      host: '127.0.0.1',
      port: 3002,
      mount: ''
    };
  }

  if(!config.server.hasOwnProperty('host')){
    config.server.host = '127.0.0.1';
  }

  if(!config.server.hasOwnProperty('port')){
    config.server.port = 3002;
  }

  var root = __dirname + '/public';

  var serverOptions = {
    views: {
      engines: {
        html: require('handlebars')
      },
      path: Path.join(__dirname, 'views'),
      isCached: (config.env !== 'development')
    }
  };

  var server = Hapi.createServer(
    config.server.host,
    config.server.port,
    serverOptions
  );

  // fake asset bundling

  // local less
  var cssAssets = [];

  fs.readdirSync(__dirname + '/public/less').forEach(function(file) {
    if ( file.substr(0,1) === '.' ) {
      return;
    }
    if ( file.substr(0,1) === '#' ) {
      return;
    }
    cssAssets.push(file.slice(0, -5) + '.css');
  });

  var css = _.map(cssAssets, function(x){
    return '<link rel="stylesheet" href="css/' + x + '" />';
  }).join("\n");


  var jsAssets = [
    // vendor
    'vendor/jquery/dist/jquery.js',
    'vendor/underscore/underscore.js',
    'vendor/backbone/backbone.js',
    'vendor/node-uuid/uuid.js',


    // app corre
    'js/app.js',
    'js/tools.js',
    'js/socket.js',

    'js/models/star.js',
    'js/models/system.js',
    'js/models/planet.js',
    'js/models/empire.js',
    'js/models/universe.js',

    'js/collections/empires.js',
    'js/collections/stars.js',
    'js/collections/systems.js',
    'js/collections/planets.js',
    'js/collections/ships.js',

  ];
  
  // models, collections, views
  _.each(['models','collections','views'], function(dir){
    fs.readdirSync(__dirname + '/public/js/' + dir).forEach(function(file) {
      if (_.contains(['.','#','~'],file.substr(0,1))) {
        return;
      }
      jsAssets.push('js/' + dir + '/' + file);
    });
  });

  var js = _.map(jsAssets, function(x){
    return '<script type="text/javascript" src="' + x + '"></script>';
  }).join("\n");

  js = '<script>window.MOUNT="' + config.server.mount + '";</script>' + "\n" + js;

  var appHandler = function (request, reply) {
    reply.view('app', {
      js: js,
      css: css,
      ga: config.ga || ''    
    });
  };
 
  server.route({
    method: 'GET',
    path: '/',
    handler: appHandler
  });


  // asset routes - css, js, images

  server.route({
    method: 'GET',
    path: '/images/{path*}',
    handler: {
      directory: {
        path: Path.join(__dirname, 'public/images'),
        listing: false,
        index: false
      }
    }
  });

  server.route({
    method: 'GET',
    path: '/vendor/{path*}',
    handler: {
      directory: {
        path: Path.join(__dirname, 'public/vendor'),
        listing: false,
        index: false
      }
    }
  });

  server.route({
    method: 'GET',
    path: '/js/{path*}',
    handler: {
      directory: {
        path: Path.join(__dirname, 'public/js'),
        listing: false,
        index: false
      }
    }
  });

  // less

  server.pack.register({
    plugin: require('hapi-less'),
    options: {
      home: __dirname + '/public/less',
      route: '/css/{filename*}',
      less: {
        compress: true
      }
    }
  }, function (err) {
    if (err) {
      console.log('Failed loading hapi-less');
    }
  });


  // api routes

  // ...

  // catchall route
  server.route({
    method: 'GET',
    path: '/{path*}',
    handler: appHandler
  });



  // lifecycle manmagement

  var start = function(done){
    async.series([
      function(next){
        server.start(next);
      },
    ], function(){
      if(done){
        done();
      } 
    });
  };

  var stop = function(done){
    async.series([
      function(next){
        server.stop({
          timeout: 1000
        }, function(err, res){
          next();
        });
      }
    ], done);
  };

  return{
    start: start,
    stop: stop
  };

};
