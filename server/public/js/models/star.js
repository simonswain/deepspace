var STAR_TYPES = ['O', 'B', 'A', 'F', 'G', 'K', 'M'];

var STAR_HUES = {
  'O': '#9bb0ff',
  'B': '#aabfff',
  'A': '#cad7ff',
  'F': '#f8f7ff',
  'G': '#fff4ea',
  'K': '#ffd2a1',
  'M': '#ffcc6f'
};

App.Models.Star = Backbone.Model.extend({
  defaults: {
    id: null,
    name:'Unknown Star',
    size: 1,
    type: null,
    color: '#ffffff',
    x: null,
    y: null
  },
  initialize: function(opts) {
    var type = STAR_TYPES[random.from0to(STAR_TYPES.length-1)];
    var size = 3 + random.from0to(3);
    this.set({
      id: uuid.v4(),
      type: type,
      size: size,
      color: STAR_HUES[type]
    });

    this.system = opts && opts.system || null;

  }

});
