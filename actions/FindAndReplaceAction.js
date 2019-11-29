
class FindAndReplaceAction extends Action {
  constructor(id, data) {
    super(
      id,
      'FindAndReplaceAction',
      data || {
        regex_find: '',
        regex_replace: '',
        regex_flags: 'gm'
      }
    );
  }

  $properties() {
    return {
      find: {
        description: 'Find',
        data: 'regex_find'
      },
      replace: {
        description: 'Replace',
        data: 'regex_replace'       
      },
      flags: {
        description: 'Flags',
        data: 'regex_flags'       
      }
    }
  }

  $description() {
    return `/${this.data.regex_find}/${this.data.regex_flags} -> ${this.data.regex_replace}`;
  }

  $preview() {
    var model = editor.getModel();
    var matches = model.findMatches(this.data.regex_find, false, true, true);

    var newDecorations = [];
    for (var matchItem of matches)
      newDecorations.push({ range: matchItem.range, options: { isWholeLine: false, inlineClassName: 'myInlineDecoration', minimap: { color: '#28a745' } }});

    var decorations = editor.deltaDecorations([], newDecorations);
  }

  $apply(original) {
    var re = new RegExp(this.data.regex_find, this.data.regex_flags);
    return original.replace(re, JSON.parse('"' + this.data.regex_replace + '"'));
  }
}