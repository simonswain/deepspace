module.exports = function(env){

  if(!env){
    env = 'development';
  }

  var nickname = 'deepspace';

  var server = {
    host: 'localhost',
    port: 3002,
    mount: ''
  }

  return {
    nickname: nickname,
    env: env,
    server: server
  };

}
