import * as msgs from "./messages.js"

const splitter = document.getElementById('splitter');
const leftPanel = document.getElementById('left-panel');
const container = document.querySelector('.container');
const chatInput = document.getElementById('chat-input');
const chatHistory = document.getElementById('chat-history');
const sendButton = document.getElementById('send-button');
const inputSection = document.getElementById('input-section');
const statusSection = document.getElementById('status-section');
const chatsSection = document.getElementById('chats-section');

let isResizing = false;
let autoScroll = true;

let context = "";

splitter.addEventListener('mousedown', (e) => {
  isResizing = true;
  document.addEventListener('mousemove', resize);
  document.addEventListener('mouseup', stopResize);
});

function resize(e) {
  if (isResizing) {
    const newWidth = e.clientX - container.offsetLeft;
    leftPanel.style.width = `${newWidth}px`;
  }
}

function stopResize() {
  isResizing = false;
  document.removeEventListener('mousemove', resize);
}

async function sendMessage() {
  const message = chatInput.value.trim();
  if (message) {
    const response = await sendJsonData("/msg", {
      text: message,
      context
    });
    chatInput.value = '';
    adjustTextareaHeight();
  }
}

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendButton.addEventListener('click', sendMessage);

function setMessage(id, type, heading, content, kvps = null) {
  let messageContainer = document.getElementById(`message-${id}`);

  if (messageContainer) {
    messageContainer.innerHTML = '';
  } else {
    const sender = type === 'user' ? 'user' : 'ai';
    messageContainer = document.createElement('div');
    messageContainer.id = `message-${id}`;
    messageContainer.classList.add('message-container', `${sender}-container`);
  }

  const handler = msgs.getHandler(type);
  handler(messageContainer, id, type, heading, content, kvps);

  if (!document.getElementById(`message-${id}`)) {
    chatHistory.appendChild(messageContainer);
  }

  if (autoScroll) chatHistory.scrollTop = chatHistory.scrollHeight;
}

function adjustTextareaHeight() {
  chatInput.style.height = 'auto';
  chatInput.style.height = (chatInput.scrollHeight) + 'px';
}

async function sendJsonData(url, data) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  const jsonResponse = await response.json();
  return jsonResponse;
}

function generateGUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0;
    var v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

let lastLogVersion = 0;
let lastLogGuid = ""

async function poll() {
  try {
    const response = await sendJsonData("/poll", {
      log_from: lastLogVersion,
      context
    });

    if (response.ok) {
      setContext(response.context)

      if (lastLogGuid != response.log_guid) {
        chatHistory.innerHTML = ""
        lastLogVersion = 0
      }

      if (lastLogVersion != response.log_version) {
        for (const log of response.logs) {
          setMessage(log.no, log.type, log.heading, log.content, log.kvps);
        }
      }

      const inputAD = Alpine.$data(inputSection);
      inputAD.paused = response.paused;
      const statusAD = Alpine.$data(statusSection);
      statusAD.connected = response.ok;
      const chatsAD = Alpine.$data(chatsSection);
      chatsAD.contexts = response.contexts;

      lastLogVersion = response.log_version;
      lastLogGuid = response.log_guid;
    }

  } catch (error) {
    console.error('Error:', error);
    const statusAD = Alpine.$data(statusSection);
    statusAD.connected = false;
  }
}

window.pauseAgent = async function(paused) {
  const resp = await sendJsonData("/pause", {
    paused: paused,
    context
  });
}

window.resetChat = async function() {
  const resp = await sendJsonData("/reset", {
    context
  });
}

window.newChat = async function() {
  setContext(generateGUID());
}

window.killChat = async function(id) {
  const chatsAD = Alpine.$data(chatsSection);
  let found, other
  for (let i = 0; i < chatsAD.contexts.length; i++) {
    if (chatsAD.contexts[i].id == id) {
      found = true
    } else {
      other = chatsAD.contexts[i]
    }
    if (found && other) break
  }

  if (context == id && found) {
    if (other) setContext(other.id)
    else setContext(generateGUID())
  }

  if (found) sendJsonData("/remove", {
    context: id
  });
}

window.selectChat = async function(id) {
  setContext(id)
}

const setContext = function(id) {
  if (id == context) return
  context = id
  lastLogGuid = ""
  lastLogVersion = 0
  const chatsAD = Alpine.$data(chatsSection);
  chatsAD.selected = id
}

window.toggleAutoScroll = async function(_autoScroll) {
  autoScroll = _autoScroll;
}

window.toggleJson = async function(showJson) {
  toggleCssProperty('.msg-json', 'display', showJson ? 'block' : 'none');
}

window.toggleThoughts = async function(showThoughts) {
  toggleCssProperty('.msg-thoughts', 'display', showThoughts ? undefined : 'none');
}

function toggleCssProperty(selector, property, value) {
  const styleSheets = document.styleSheets;

  for (let i = 0; i < styleSheets.length; i++) {
    const styleSheet = styleSheets[i];
    const rules = styleSheet.cssRules || styleSheet.rules;

    for (let j = 0; j < rules.length; j++) {
      const rule = rules[j];
      if (rule.selectorText == selector) {
        if (value === undefined) {
          rule.style.removeProperty(property);
        } else {
          rule.style.setProperty(property, value);
        }
        return;
      }
    }
  }
}

// Templates functionality
const templatesSection = document.getElementById('templates-section');
const templateList = templatesSection.querySelector('.template-list');
const addTemplateButton = templatesSection.querySelector('#addTemplateBtn');
const modal = templatesSection.querySelector('#templateModal');
const modalContent = modal.querySelector('.modal-content');

let templates = [];
let currentTemplate = null;

function renderTemplates() {
  templateList.innerHTML = '';
  templates.forEach(template => {
    const li = document.createElement('li');
    li.className = 'template-item';
    li.innerHTML = `
            <span class="template-name">${template.name}</span>
            <div class="template-actions">
                <button class="edit-button">Edit</button>
                <button class="delete-button">Delete</button>
            </div>
        `;
    li.querySelector('.template-name').addEventListener('click', () => useTemplate(template.id));
    li.querySelector('.edit-button').addEventListener('click', () => editTemplate(template));
    li.querySelector('.delete-button').addEventListener('click', () => deleteTemplate(template.id));
    templateList.appendChild(li);
  });
}

async function loadTemplates() {
  try {
    const response = await fetch("/templates");
    if (response.ok) {
      const data = await response.json();
      templates = data.templates;
      renderTemplates();
    } else {
      console.error("Failed to load templates:", response.statusText);
    }
  } catch (error) {
    console.error("Error loading templates:", error);
  }
}

function openModal(template = null) {
  currentTemplate = template || {
    id: '',
    name: '',
    url: '',
    navigation_goal: '',
    data_extraction_goal: '',
    advanced_settings: {}
  };
  modalContent.innerHTML = `
        <h2>${currentTemplate.id ? 'Edit Template' : 'New Template'}</h2>
        <input type="text" id="templateName" placeholder="Template Name" value="${currentTemplate.name}">
        <input type="text" id="templateUrl" placeholder="URL" value="${currentTemplate.url}">
        <textarea id="navigationGoal" placeholder="Navigation Goal">${currentTemplate.navigation_goal}</textarea>
        <textarea id="dataExtractionGoal" placeholder="Data Extraction Goal">${currentTemplate.data_extraction_goal}</textarea>
        <textarea id="advancedSettings" placeholder="Advanced Settings">${JSON.stringify(currentTemplate.advanced_settings, null, 2)}</textarea>
        <div class="modal-actions">
            <button class="save-button">Save</button>
            <button class="cancel-button">Cancel</button>
        </div>
    `;
  modalContent.querySelector('.save-button').addEventListener('click', saveTemplate);
  modalContent.querySelector('.cancel-button').addEventListener('click', closeModal);
  modal.style.display = 'block';
}

function closeModal() {
  modal.style.display = 'none';
}

async function saveTemplate() {
  const templateData = {
    id: currentTemplate.id, // Include the ID for editing existing templates
    name: modalContent.querySelector('#templateName').value,
    url: modalContent.querySelector('#templateUrl').value,
    navigation_goal: modalContent.querySelector('#navigationGoal').value,
    data_extraction_goal: modalContent.querySelector('#dataExtractionGoal').value,
    advanced_settings: JSON.parse(modalContent.querySelector('#advancedSettings').value)
  };

  const response = await sendJsonData("/templates", templateData);
  if (response.ok) {
    await loadTemplates();
    closeModal();
  } else {
    alert("Error saving template: " + response.message);
  }
}

function editTemplate(template) {
  openModal(template);
}

async function deleteTemplate(templateId) {
  if (confirm("Are you sure you want to delete this template?")) {
    const response = await sendJsonData("/delete_template", {
      id: templateId
    });
    if (response.ok) {
      await loadTemplates();
    } else {
      alert("Error deleting template: " + response.message);
    }
  }
}

async function useTemplate(templateId) {
  const response = await sendJsonData("/use_template", {
    template_id: templateId,
    context
  });
  if (response.ok) {
    console.log("Template applied successfully");
  } else {
    alert("Error using template: " + response.message);
  }
}

addTemplateButton.addEventListener('click', () => openModal());

// Initialize templates
loadTemplates();
chatInput.addEventListener('input', adjustTextareaHeight);

setInterval(poll, 250);
