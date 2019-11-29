class Action {
  constructor(id, type, data) {
    this.id = id;
    this.type = type || 'Action';
    this.data = data || {};
    this.enabled = true;
  }

  $description() {
    return JSON.stringify(this.data);
  }

  $properties() {
    return {};
  }

  $preview() {}
  $apply() {}
}