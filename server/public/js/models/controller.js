/*global $:true, Backbone:true, _:true, App:true */
/*jshint browser:true */
/*jshint strict:false */

App.Models.Controller = Backbone.Model.extend({
  defaults: {
    view: null,
    obj_id: null,
    child_id: null
  }
});

