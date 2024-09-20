// index.js

import * as msgs from "./messages.js";

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
        const response = await sendJsonData("/msg", { text: message, context });
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
let lastLogGuid = "";

async function poll() {
    try {
        const response = await sendJsonData("/poll", { log_from: lastLogVersion, context });

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
    const resp = await sendJsonData("/pause", { paused: paused, context });
}

window.resetChat = async function() {
    const resp = await sendJsonData("/reset", { context });
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
    
    if (found) sendJsonData("/remove", { context: id });
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

       for (let j=0; j < rules.length; j++) {
           const rule=rules[j];
           if(rule.selectorText==selector){
               if(value===undefined){
                   rule.style.removeProperty(property);
               }else{
                   rule.style.setProperty(property,value);
               }
               return;
           }
       }
   }
}

// Templates functionality
const templatesSection=document.getElementById('templates-section');
const templateList=templatesSection.querySelector('.template-list');
const addTemplateButton=templatesSection.querySelector('#addTemplateBtn');
const modal=document.getElementById('templateModal');
const modalContent=modal.querySelector('.modal-content');

let templates=[];
let currentTemplate=null;

function renderTemplates() {
   templateList.innerHTML='';
   templates.forEach(template => {
       const li=document.createElement('li');
       li.className='template-item';
       li.innerHTML=`
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
   try{
       const response=await fetch("/templates");
       if(response.ok){
           const data=await response.json();
           templates=data.templates;
           renderTemplates();
       }else{
           console.error("Failed to load templates:",response.statusText);
       }
   }catch(error){
       console.error("Error loading templates:",error);
   }
}

function openModal(template=null){
   currentTemplate=template||{
      id: '',
      name: '',
      url: '',
      description: '',
      http_method: '',
      endpoint_url: '',
      headers: {},
      query_parameters: {},
      request_body: {},
      response_mapping: {},
      error_handling: {},
      execution_schedule: '',
      navigation_goal: '',
      data_extraction_goal: '',
      advanced_settings: {},
      tags: [],
      version: '1.0',
      default_tool: '',
      visibility_options: {},
      display_order: 0,
      created_at: null,
      modified_at: null
   };
   modalContent.innerHTML=`
       <h2>${currentTemplate.id ? 'Edit Template' : 'New Template'}</h2>
       <div class="scrollable-container">
           <label for="templateName"><h3>Template Name</h3></label>
           <h4>Enter the name of the template.</h4>
           <input type="text" id="templateName" placeholder="Template Name" value="${currentTemplate.name}">
           
           <label for="httpMethod"><h3>HTTP Method</h3></label>
           <h4>Specify the HTTP method (e.g., GET, POST).</h4>
           <input type="text" id="httpMethod" placeholder="HTTP Method" value="${currentTemplate.http_method}">

           <label for="url"><h3>URL</h3></label>
           <h4>Provide the URL for the template.</h4>
           <input type="text" id="url" placeholder="URL" value="${currentTemplate.url}">

           <label for="description"><h3>Description</h3></label>
           <h4>Enter a description for the template.</h4>
           <textarea id="description" placeholder="Description">${currentTemplate.description}</textarea>

           <label for="endpointUrl"><h3>Endpoint URL</h3></label>
           <h4>Provide the endpoint URL for the template.</h4>
           <input type="text" id="endpointUrl" placeholder="Endpoint URL" value="${currentTemplate.endpoint_url}">
           
           <label for="headers"><h3>Headers</h3></label>
           <h4>Enter the headers in JSON format.</h4>
           <textarea id="headers" placeholder="Headers (JSON format)">${JSON.stringify(currentTemplate.headers)}</textarea>
           
           <label for="queryParameters"><h3>Query Parameters</h3></label>
           <h4>Enter the query parameters in JSON format.</h4>
           <textarea id="queryParameters" placeholder="Query Parameters (JSON format)">${JSON.stringify(currentTemplate.query_parameters)}</textarea>
           
           <label for="requestBody"><h3>Request Body</h3></label>
           <h4>Enter the request body in JSON format.</h4>
           <textarea id="requestBody" placeholder="Request Body (JSON format)">${JSON.stringify(currentTemplate.request_body)}</textarea>
           
           <label for="responseMapping"><h3>Response Mapping</h3></label>
           <h4>Enter the response mapping in JSON format.</h4>
           <textarea id="responseMapping" placeholder="Response Mapping (JSON format)">${JSON.stringify(currentTemplate.response_mapping)}</textarea>
           
           <label for="errorHandling"><h3>Error Handling</h3></label>
           <h4>Enter the error handling in JSON format.</h4>
           <textarea id="errorHandling" placeholder="Error Handling (JSON format)">${JSON.stringify(currentTemplate.error_handling)}</textarea>

           <label for="advancedSettings"><h3>Advanced Settings</h3></label>
           <h4>Enter the advanced settings in JSON format.</h4>
           <textarea id="advancedSettings" placeholder="Advanced Settings (JSON format)">${JSON.stringify(currentTemplate.advanced_settings)}</textarea>
           
           <label for="executionSchedule"><h3>Execution Schedule</h3></label>
           <h4>Specify the execution schedule.</h4>
           <input type="text" id="executionSchedule" placeholder="Execution Schedule" value="${currentTemplate.execution_schedule}">
           
           <label for="tags"><h3>Tags</h3></label>
           <h4>Enter tags separated by commas.</h4>
           <input type="text" id="tags" placeholder="Tags (comma-separated)" value="${currentTemplate.tags.join(',')}">
           
           <label for="version"><h3>Version</h3></label>
           <h4>Specify the version of the template.</h4>
           <input type="text" id="version" placeholder="Version" value="${currentTemplate.version}">
           
           <label for="defaultTool"><h3>Default Tool</h3></label>
           <h4>Enter the default tool for the template.</h4>
           <input type="text" id="defaultTool" placeholder="Default Tool" value="${currentTemplate.default_tool}">
           
           <label for="visibilityOptions"><h3>Visibility Options</h3></label>
           <h4>Specify the visibility options in JSON format.</h4>
           <textarea id="visibilityOptions" placeholder="Visibility Options (JSON format)">${JSON.stringify(currentTemplate.visibility_options)}</textarea>
       </div>
       <div class="modal-actions">
           <button class="save-button">Save</button>
           <button class="cancel-button">Cancel</button>
       </div>
   `;
   
   modalContent.querySelector('.save-button').addEventListener('click', saveTemplate);
   modalContent.querySelector('.cancel-button').addEventListener('click', closeModal);
   modal.style.display='block';
}

function closeModal(){
   modal.style.display='none';
}

async function saveTemplate(){
   const templateData={
      id:currentTemplate.id,
      name:modalContent.querySelector('#templateName').value,
      url:modalContent.querySelector('#url').value,
      description:modalContent.querySelector('#description').value,
      http_method:modalContent.querySelector('#httpMethod').value || 'GET',
      endpoint_url:modalContent.querySelector('#endpointUrl').value,
      headers:JSON.parse(modalContent.querySelector('#headers').value || '{}'),
      query_parameters:JSON.parse(modalContent.querySelector('#queryParameters').value || '{}'),
      request_body:JSON.parse(modalContent.querySelector('#requestBody').value || '{}'),
      response_mapping:JSON.parse(modalContent.querySelector('#responseMapping').value || '{}'),
      error_handling:JSON.parse(modalContent.querySelector('#errorHandling').value || '{}'),
      execution_schedule:modalContent.querySelector('#executionSchedule').value || '',
      advanced_settings:JSON.parse(modalContent.querySelector('#advancedSettings').value || '{}'),
      tags:modalContent.querySelector('#tags').value.split(',').map(tag=>tag.trim()),
      version:modalContent.querySelector('#version').value || '1.0',
      default_tool:modalContent.querySelector('#defaultTool').value || '',
      visibility_options:JSON.parse(modalContent.querySelector('#visibilityOptions').value || '{}'),
   };

   const response=await sendJsonData("/templates",templateData);
   if(response.ok){
      await loadTemplates();
      closeModal();
   }else{
      alert("Error saving template: " + response.message);
   }
}

function editTemplate(template){
   openModal(template);
}

async function deleteTemplate(templateId){
   if(confirm("Are you sure you want to delete this template?")){
      const response=await sendJsonData("/delete_template",{id:templateId});
      if(response.ok){
         await loadTemplates();
      }else{
         alert("Error deleting template: " + response.message);
      }
   }
}

async function useTemplate(templateId){
   const response=await sendJsonData("/use_template",{template_id:templateId,context});
   if(response.ok){
      console.log("Template applied successfully");
   }else{
      alert("Error using template: " + response.message);
   }
}

// Initialize templates on page load
loadTemplates();
chatInput.addEventListener('input', adjustTextareaHeight);

// Polling for updates
setInterval(poll, 250);

// Fix for Add New Template button
addTemplateButton.addEventListener('click', () => openModal());
