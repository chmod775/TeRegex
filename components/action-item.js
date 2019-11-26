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
    },
    delete_action: function() {
      this.delete(this.item);
    }
  },
  props: ['item', 'selected', 'select', 'refresh', 'delete']
})