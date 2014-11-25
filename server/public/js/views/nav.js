/*global Backbone:true, $:true, _:true, App:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */

App.Views.Nav = Backbone.View.extend({
  template: _.template('<h1><%= title %></h1>'),
  initialize : function(opts) {
    _.bindAll(this, 'render');
    this.controller = opts.controller;
    this.listenTo(this.controller, 'change:view', this.render);
    this.render();
  },
  render : function(){
    var data = {
      title: ''
    };
    var ix = 0;
    var current = this.controller.get('view_id');
    var index = App.index;
    if(current && current !== 'default'){
      while(index[ix][0] !== current && ix < index.length){
        ix ++;
      }
      data.title = index[ix][1];
    }
    this.$el.html(this.template(data));
  }
});
