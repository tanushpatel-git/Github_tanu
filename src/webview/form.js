(function () {
  const vscode = acquireVsCodeApi();

  let currentCommand = null;
  let currentValues = {};

  window.addEventListener('message', function (event) {
    var message = event.data;
    switch (message.type) {
      case 'loadCommand':
        renderForm(message.command);
        break;
      case 'fileSelected':
      case 'folderSelected':
        var input = document.querySelector(
          'input[name="' + message.inputName + '"]'
        );
        if (input) {
          input.value = message.value;
          currentValues[message.inputName] = message.value;
        }
        break;
    }
  });

  function renderForm(command) {
    currentCommand = command;
    currentValues = {};

    var formContainer = document.getElementById('form-container');
    formContainer.innerHTML = '';
    formContainer.style.display = 'block';

    var previewContainer = document.getElementById('preview-container');
    previewContainer.innerHTML = '';
    previewContainer.style.display = 'none';

    var header = document.createElement('div');
    header.className = 'form-header';
    header.appendChild(createElement('h2', command.name));

    var badge = document.createElement('span');
    badge.className = 'category-badge';
    badge.textContent = command.category;
    header.appendChild(badge);

    if (command.description) {
      var desc = document.createElement('p');
      desc.className = 'description';
      desc.textContent = command.description;
      header.appendChild(desc);
    }
    formContainer.appendChild(header);

    var formBody = document.createElement('div');
    formBody.className = 'form-body';

    if (command.inputs && command.inputs.length > 0) {
      command.inputs.forEach(function (input) {
        formBody.appendChild(createInputGroup(input));
      });
    }
    formContainer.appendChild(formBody);

    var buttonGroup = document.createElement('div');
    buttonGroup.className = 'form-buttons';

    var previewBtn = createButton('Preview', 'btn-primary', function () {
      showPreview();
    });
    buttonGroup.appendChild(previewBtn);

    var cancelBtn = createButton('Cancel', 'btn-secondary', function () {
      vscode.postMessage({ type: 'cancel' });
    });
    buttonGroup.appendChild(cancelBtn);

    formContainer.appendChild(buttonGroup);
  }

  function createInputGroup(input) {
    var group = document.createElement('div');
    group.className = 'input-group';

    var label = document.createElement('label');
    label.className = 'input-label';
    label.textContent = input.label;
    if (input.required) {
      var required = document.createElement('span');
      required.className = 'required';
      required.textContent = ' *';
      label.appendChild(required);
    }
    group.appendChild(label);

    switch (input.type) {
      case 'text':
        var textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.name = input.name;
        textInput.className = 'input text-input';
        textInput.placeholder = input.placeholder || '';
        textInput.required = input.required;
        textInput.addEventListener('input', function () {
          currentValues[input.name] = textInput.value;
        });
        group.appendChild(textInput);
        break;

      case 'textarea':
        var textarea = document.createElement('textarea');
        textarea.name = input.name;
        textarea.className = 'input textarea-input';
        textarea.placeholder = input.placeholder || '';
        textarea.rows = 3;
        textarea.addEventListener('input', function () {
          currentValues[input.name] = textarea.value;
        });
        group.appendChild(textarea);
        break;

      case 'select':
        var select = document.createElement('select');
        select.name = input.name;
        select.className = 'input select-input';
        if (input.options) {
          input.options.forEach(function (opt) {
            var option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            select.appendChild(option);
          });
        }
        select.addEventListener('change', function () {
          currentValues[input.name] = select.value;
        });
        group.appendChild(select);
        if (input.options && input.options.length > 0) {
          currentValues[input.name] = input.options[0].value;
        }
        break;

      case 'checkbox':
        var checkboxGroup = document.createElement('div');
        checkboxGroup.className = 'checkbox-group';
        if (input.options) {
          input.options.forEach(function (opt) {
            var wrapper = document.createElement('label');
            wrapper.className = 'checkbox-label';
            var cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.name = input.name;
            cb.value = opt.value;
            cb.addEventListener('change', function () {
              updateCheckboxValue(input.name);
            });
            wrapper.appendChild(cb);
            var span = document.createElement('span');
            span.textContent = opt.label;
            wrapper.appendChild(span);
            checkboxGroup.appendChild(wrapper);
          });
        }
        group.appendChild(checkboxGroup);
        currentValues[input.name] = '';
        break;

      case 'radio':
        var radioGroup = document.createElement('div');
        radioGroup.className = 'radio-group';
        if (input.options) {
          input.options.forEach(function (opt, index) {
            var wrapper = document.createElement('label');
            wrapper.className = 'radio-label';
            var rb = document.createElement('input');
            rb.type = 'radio';
            rb.name = input.name;
            rb.value = opt.value;
            if (index === 0) {
              rb.checked = true;
            }
            rb.addEventListener('change', function () {
              if (rb.checked) {
                currentValues[input.name] = rb.value;
              }
            });
            wrapper.appendChild(rb);
            var span = document.createElement('span');
            span.textContent = opt.label;
            wrapper.appendChild(span);
            radioGroup.appendChild(wrapper);
          });
        }
        group.appendChild(radioGroup);
        if (input.options && input.options.length > 0) {
          currentValues[input.name] = input.options[0].value;
        }
        break;

      case 'file':
      case 'folder':
        var browseGroup = document.createElement('div');
        browseGroup.className = 'browse-group';
        var fileInput = document.createElement('input');
        fileInput.type = 'text';
        fileInput.name = input.name;
        fileInput.className = 'input text-input';
        fileInput.readOnly = true;
        fileInput.placeholder = 'Select ' + input.type + '...';
        browseGroup.appendChild(fileInput);
        var browseBtn = document.createElement('button');
        browseBtn.className = 'browse-btn';
        browseBtn.textContent = 'Browse';
        browseBtn.addEventListener('click', function () {
          vscode.postMessage({
            type: input.type === 'file' ? 'browseFile' : 'browseFolder',
            inputName: input.name,
          });
        });
        browseGroup.appendChild(browseBtn);
        group.appendChild(browseGroup);
        break;
    }

    return group;
  }

  function updateCheckboxValue(name) {
    var checkboxes = document.querySelectorAll(
      'input[type="checkbox"][name="' + name + '"]:checked'
    );
    var values = [];
    checkboxes.forEach(function (cb) {
      values.push(cb.value);
    });
    currentValues[name] = values.join(' ');
  }

  function showPreview() {
    var errors = validate();
    if (errors.length > 0) {
      showErrors(errors);
      return;
    }

    clearErrors();

    var commandText = buildCommand();

    var previewContainer = document.getElementById('preview-container');
    previewContainer.innerHTML = '';
    previewContainer.style.display = 'block';

    document.getElementById('form-container').style.display = 'none';

    var header = document.createElement('div');
    header.className = 'preview-header';
    header.appendChild(
      createElement('h3', 'Command Preview')
    );
    previewContainer.appendChild(header);

    var previewBox = document.createElement('div');
    previewBox.className = 'preview-box';

    var label = document.createElement('div');
    label.className = 'preview-label';
    label.textContent = 'Final Command:';
    previewBox.appendChild(label);

    var pre = document.createElement('pre');
    pre.className = 'preview-command';
    pre.textContent = commandText;
    previewBox.appendChild(pre);

    previewContainer.appendChild(previewBox);

    var editArea = document.createElement('div');
    editArea.className = 'edit-area';
    editArea.style.display = 'none';

    var editLabel = document.createElement('div');
    editLabel.className = 'preview-label';
    editLabel.textContent = 'Edit Command:';
    editArea.appendChild(editLabel);

    var editInput = document.createElement('textarea');
    editInput.className = 'edit-input';
    editInput.value = commandText;
    editArea.appendChild(editInput);

    previewContainer.appendChild(editArea);

    var buttonGroup = document.createElement('div');
    buttonGroup.className = 'form-buttons';

    var runBtn = createButton('Run', 'btn-primary', function () {
      var finalCommand =
        editArea.style.display === 'block'
          ? editInput.value
          : commandText;
      vscode.postMessage({
        type: 'execute',
        command: finalCommand,
      });
    });
    buttonGroup.appendChild(runBtn);

    var editBtn = createButton('Edit', 'btn-secondary', function () {
      var isVisible = editArea.style.display === 'block';
      editArea.style.display = isVisible ? 'none' : 'block';
      editBtn.textContent = isVisible ? 'Edit' : 'Hide Edit';
    });
    buttonGroup.appendChild(editBtn);

    var backBtn = createButton('Back', 'btn-secondary', function () {
      previewContainer.style.display = 'none';
      previewContainer.innerHTML = '';
      document.getElementById('form-container').style.display = 'block';
    });
    buttonGroup.appendChild(backBtn);

    previewContainer.appendChild(buttonGroup);
  }

  function validate() {
    var errors = [];
    if (!currentCommand || !currentCommand.inputs) return errors;
    currentCommand.inputs.forEach(function (input) {
      if (input.required) {
        var val = currentValues[input.name];
        if (!val || val.trim() === '') {
          errors.push(input.label + ' is required');
        }
      }
    });
    return errors;
  }

  function buildCommand() {
    if (!currentCommand) return '';
    var cmd = currentCommand.command;
    for (var i = 0; i < currentCommand.inputs.length; i++) {
      var input = currentCommand.inputs[i];
      if (currentValues[input.name]) {
        cmd = cmd.replace(
          new RegExp('\\{' + escapeRegex(input.name) + '\\}', 'g'),
          currentValues[input.name]
        );
      }
    }
    return cmd;
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function showErrors(errors) {
    clearErrors();
    var formContainer = document.getElementById('form-container');
    var errorContainer = document.createElement('div');
    errorContainer.className = 'error-container';
    errorContainer.id = 'error-container';
    errors.forEach(function (err) {
      var div = document.createElement('div');
      div.className = 'error-item';
      div.textContent = '! ' + err;
      errorContainer.appendChild(div);
    });
    var header = formContainer.querySelector('.form-header');
    if (header) {
      header.parentNode.insertBefore(errorContainer, header.nextSibling);
    } else {
      formContainer.insertBefore(errorContainer, formContainer.firstChild);
    }
  }

  function clearErrors() {
    var existing = document.getElementById('error-container');
    if (existing) {
      existing.parentNode.removeChild(existing);
    }
  }

  function createButton(text, className, onClick) {
    var btn = document.createElement('button');
    btn.className = 'btn ' + className;
    btn.textContent = text;
    btn.addEventListener('click', onClick);
    return btn;
  }

  function createElement(tag, text) {
    var el = document.createElement(tag);
    el.textContent = text;
    return el;
  }
})();
