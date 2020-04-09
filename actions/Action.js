class Action {
  constructor(id, type, data) {
    this.id = id;
    this.type = type || 'Action';
    this.data = data || {};
    this.enabled = true;
    
    this._cache = null;
  }

  $description() {
    return JSON.stringify(this.data);
  }

  $properties() {
    return {};
  }

  $preview(preoutput, output) {}
  $apply() {}

  $editorType() { return 'normal'; }
}