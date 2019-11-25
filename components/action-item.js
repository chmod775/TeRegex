Vue.component('action-item', {
  data: function () {
    return {
    }
  },
  provide: function() {
    return {
    }
  },
  methods: {
    set_enabled: function(enabled) {
      this.item.enabled = enabled;
      this.refresh();
      return null;
    }
  },
  props: ['item', 'selected', 'select', 'refresh']
})