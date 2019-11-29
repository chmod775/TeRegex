class ApplyDiffAction extends Action {
  constructor(id, data) {
    super(
      id,
      'ApplyDiffAction',
      data || {
        patch: ''
      }
    );

    this.dmp = new DiffMatchPatch();;
  }

  $properties() {
    return {
      selection: {
        description: 'Apply file',
        function: this.applyFile
      }
    }
  }

  applyFile(sender) {
    const selectedPaths = dialog.showOpenDialog();
    selectedPaths.then(val => {
      if (val.filePaths) {
        try {
          var fileContent = fs.readFileSync(val.filePaths[0], 'latin1');
          var content = editor.getValue();

          sender.data.patch = sender.dmp.patch_toText(sender.dmp.patch_make(content, fileContent))
        } catch (ex) {
          alert("An error ocurred reading the file :" + ex.message);
          return;
        }
      }
    }); 
  }

  $apply(original) {
    return this.dmp.patch_apply(this.dmp.patch_fromText(this.data.patch), original)[0];
  }
}