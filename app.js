const { dialog } = require('electron').remote
const fs = require('fs');
const path = require('path');

class Revision {
  constructor(rev, actions, action_selected) {
    this.rev = rev;
    this.actions = JSON.parse(JSON.stringify(actions));
    this.selected_action_id = action_selected != null ? action_selected.id : null;
  }
}

class Action {
  constructor(id, type, data) {
    this.id = id;
    this.type = type || 'Action';
    this.data = data || {};
    this.enabled = true;
  }

  description() {
    return JSON.stringify(this.data);
  }

  preview() {}
  apply() {}
}

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

  properties() {
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

  description() {
    return `/${this.data.regex_find}/${this.data.regex_flags} -> ${this.data.regex_replace}`;
  }

  preview() {
    var model = editor.getModel();
    var matches = model.findMatches(this.data.regex_find, false, true, true);

    var newDecorations = [];
    for (var matchItem of matches)
      newDecorations.push({ range: matchItem.range, options: { isWholeLine: false, inlineClassName: 'myInlineDecoration', minimap: { color: 'red' } }});

    var decorations = editor.deltaDecorations([], newDecorations);
  }

  apply(original) {
    var re = new RegExp(this.data.regex_find, this.data.regex_flags);
    return original.replace(re, this.data.regex_replace);
  }
}

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

  description() {
    return `${this.data.selections.length} selection${this.data.selections.length > 1 ? 's' : ''} -> ${this.data.replace_content}`;
  }

  properties() {
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

  preview() {
    var model = editor.getModel();
    
    var newDecorations = [];
    for (var rangeItem of this.data.selections)
      newDecorations.push({ range: rangeItem, options: { isWholeLine: false, inlineClassName: 'myInlineDecoration', minimap: { color: 'red' } }});

    var decorations = editor.deltaDecorations([], newDecorations);
  }

  apply(original) {
    var model = monaco.editor.createModel(original, "text/plain");

    for (var rangeItem of this.data.selections)
      model.applyEdits([{ range: rangeItem, text: this.data.replace_content }]);

    return model.getValue();
  }
}

const actions_toolbox = {
  FindAndReplaceAction: FindAndReplaceAction,
  ReplaceSelectionAction: ReplaceSelectionAction
};

var app = new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue!',

    original_filename: null,
    original_content: '',

    action_id_counter: 0,
    actions: [],
    action_selected: null,

    revisions: [ new Revision(0, [], null) ],
    revision_selected: 0
  },
  methods: {
    new_action: function() {
      this.action_id_counter++;
      var newItem = new FindAndReplaceAction(+this.action_id_counter);
      this.actions.push(newItem);
      this.action_selected = newItem;
      this.refresh();
    },
    select_action: function(item) {
      this.action_selected = item;
      this.refresh();
    },
    remove_action: function(item) {
      this.refresh();
    },


    drag_start: function() {
      //this.action_selected = null;
    },
    drag_end: function() {
      this.refresh();
    },

    update_selected_action: function() {
      this.refresh();
    },
    select_output: function() {
      this.action_selected = null;
      this.refresh();
    },


    action_type_changed: function() {
      var foundIdx = -1;
      for (var idx in this.actions) {
        var actionItem = this.actions[idx];
        if (actionItem.id == this.action_selected.id) {
          foundIdx = idx;
          break;
        }
      }

      if (foundIdx >= 0) {
        this.actions.splice(foundIdx, 1);
        var newAction = new actions_toolbox[this.action_selected.type](this.action_selected.id, null);
        this.actions.splice(foundIdx, 0, newAction);
        this.action_selected = newAction;
      }
    },

    refresh: function(bypass_original_editing) {
      var output = this.original_content;

      for (var idx in this.actions) {
        var action_item = this.actions[idx];

        if (this.action_selected != null)
          if (action_item.id == this.action_selected.id)
            break;

        if (action_item.enabled)
          output = action_item.apply(output);
      }

      editor.setValue(output);

      if (this.action_selected != null)
        this.action_selected.preview();

      return output;
    },

    select_revision: function(rev) {
      var revision_item = this.revisions.filter(t => t.rev == rev)[0];

      this.actions = [];
      this.action_id_counter = 0;
      for (var actionItem of revision_item.actions) {
        var newAction = new actions_toolbox[actionItem.type](actionItem.id, actionItem.data);

        this.actions.push(newAction);

        if (+actionItem.id > this.action_id_counter)
          this.action_id_counter = +actionItem.id;
      }

      this.select_action(null); //this.actions.filter(t => t.id == revision_item.selected_action_id)[0] || null);

      this.revision_selected = revision_item.rev;
      this.refresh();
    },

    open_original: function() {
      var $this = this;
      const selectedPaths = dialog.showOpenDialog();
      selectedPaths.then(val => {
        if (val.filePaths) {
          try {
            $this.original_filename = val.filePaths[0];

            var original_path = path.parse(val.filePaths[0]);
            
            // Try to open t-rex
            var trex_path = path.join(original_path.dir, original_path.name.replace(/_rev\d+/g, '') + '.trex');
            if (fs.existsSync(trex_path)) {
              var trex_project = JSON.parse(fs.readFileSync(trex_path, 'utf-8'));

              if (fs.existsSync(trex_project.original_filename)) {
                $this.original_filename = trex_project.original_filename;
                $this.revisions = trex_project.revisions;

                $this.original_content = fs.readFileSync(trex_project.original_filename, 'latin1');

                $this.select_revision(trex_project.revisions[trex_project.revisions.length - 1].rev);
              } else {
                alert("Impossible to retrive the original file.");
              }

              console.log(trex_project);
            } else {
              $this.original_content = fs.readFileSync(val.filePaths[0], 'latin1');
            }

            $this.refresh(true);
          } catch (ex) {
            alert("An error ocurred reading the file :" + err.message);
            return;
          }
        }
      });
    },

    save_revision: function() {
      if (this.original_filename) {
        var original_path = path.parse(this.original_filename);

        // Get free revision
        var rev = 0;

        for (var revItem of this.revisions)
          if (revItem.rev > rev)
            rev = revItem.rev;

        var name_with_revision = original_path.name + '_TEMP';
        while (true) {
          rev++;
          name_with_revision = original_path.name.replace(/_rev\d+/g, '') + '_rev' + rev.toString();
          if (!fs.existsSync(path.join(original_path.dir, name_with_revision + original_path.ext)))
            break;
        }

        // Create revision
        var newRevision = new Revision(rev, this.actions, this.action_selected);
        this.revisions.push(newRevision);

        var trex_project = {
          original_filename: this.original_filename,
          revisions: this.revisions
        };

        this.select_revision(trex_project.revisions[trex_project.revisions.length - 1].rev);

        // Save t-rex from extinction
        fs.writeFile(path.join(original_path.dir, original_path.name + '.trex'), JSON.stringify(trex_project), (err) => {});

        // Save content
        fs.writeFile(path.join(original_path.dir, name_with_revision + original_path.ext), this.refresh(), (err) => {});
      } else {

      }
    }
  }
});


