var len = 6;
var q = [];
var n;
while (q.length < len){
  n = random0to(9);
  console.log(q, n);
  if(q.indexOf(n)!== -1){
    continue;
  }
  q.push(n);
}

function random0to (max) {
  return Math.floor( Math.random() * max );
}
