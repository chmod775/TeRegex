class ReplaceSelectionAction extends Action {
  constructor(id, data) {
    super(
      id,
      'ReplaceSelectionAction',
      data || {
        selections: [],
        replace_content: ''
      }
    );
  }

  $description() {
    return `${this.data.selections.length} selection${this.data.selections.length > 1 ? 's' : ''} -> ${this.data.replace_content}`;
  }

  $properties() {
    return {
      selection: {
        description: 'Update selection',
        function: this.getSelection
      },
      replace: {
        description: 'Replace',
        data: 'replace_content'       
      }
    }
  }

  getSelection(sender) {
    sender.data.selections = editor.getSelections();
    sender.preview();
  }

  $preview() {
    var model = editor.getModel();
    
    var newDecorations = [];
    for (var rangeItem of this.data.selections)
      newDecorations.push({ range: rangeItem, options: { isWholeLine: false, inlineClassName: 'myInlineDecoration', minimap: { color: '#28a745' } }});

    var decorations = editor.deltaDecorations([], newDecorations);
  }

  $apply(original) {
    var model = monaco.editor.createModel(original, "text/plain");

    for (var rangeItem of this.data.selections)
      model.applyEdits([{ range: rangeItem, text: JSON.parse('"' + this.data.replace_content + '"') }]);

    return model.getValue();
  }
}