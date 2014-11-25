App.Collections.Planets = Backbone.Collection.extend({
  model: App.Models.Planet,
  initialize: function(models, opts) {
  },
  comparator: function(model){
    return Number(model.get('r'));
  }
});
