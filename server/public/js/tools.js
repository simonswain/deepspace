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
  }
};

function ra_de(r) {
  return r*(180/Math.PI);
};

function de_ra(d) {
  var pi = Math.PI;
  return (d)*(pi/180);
};

function random0to (max) {
  return Math.floor( Math.random() * max );
}

function random1to (max) {
  return 1 + Math.floor( Math.random() * max );
}

function dec2hex(d, padding) {
  var hex = Number(d).toString(16);
  padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;
  while (hex.length < padding) {
    hex = "0" + hex;
  }
  return hex;
}


var random = {
  from0upto: function (max) {
    return Math.floor( Math.random() * (max));
  },
  from0to: function (max) {
    return Math.floor( Math.random() * (max + 1));
  },
  from1to: function (max) {
    return 1 + Math.floor( Math.random() * max );
  }
};
