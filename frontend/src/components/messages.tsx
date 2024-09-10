export type MessageType = 'user' | 'agent' | 'response' | 'tool' | 'code_exe' | 'warning' | 'rate_limit' | 'error' | 'info' | 'adhoc' | 'hint';

interface Kvps {
    [key: string]: string | string[] | undefined;
}

type MessageHandler = (messageContainer: HTMLElement, id: string, type: MessageType, heading: string, content: string, kvps?: Kvps) => void;

export function getHandler(type: MessageType): MessageHandler {
    switch (type) {
        case 'user':
            return drawMessageUser;
        case 'agent':
            return drawMessageAgent;
        case 'response':
            return drawMessageResponse;
        case 'tool':
            return drawMessageTool;
        case 'code_exe':
            return drawMessageCodeExe;
        case 'warning':
        case 'rate_limit':
            return drawMessageWarning;
        case 'error':
            return drawMessageError;
        case 'info':
        case 'hint':
            return drawMessageInfo;
        case 'adhoc':
            return drawMessageAdhoc;
        default:
            return drawMessageDefault;
    }
}

export function drawMessageDefault(messageContainer: HTMLElement, id: string, type: MessageType, heading: string, content: string, kvps: Kvps = {}) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'message-ai', 'message-default');

    if (heading) messageDiv.appendChild(document.createElement('h4')).textContent = heading;

    drawKvps(messageDiv, kvps);

    const textNode = document.createElement('pre');
    textNode.textContent = content;
    textNode.style.whiteSpace = 'pre-wrap';
    textNode.style.wordBreak = 'break-word';
    textNode.classList.add("msg-json");
    messageDiv.appendChild(textNode);

    messageContainer.appendChild(messageDiv);
}

export function drawMessageAgent(messageContainer: HTMLElement, id: string, type: MessageType, heading: string, content: string, kvps: Kvps = {}) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'message-ai', 'message-agent');

    if (heading) messageDiv.appendChild(document.createElement('h4')).textContent = heading;

    if (kvps) {
        const kvpsFlat: Kvps = {};
        for (const key in kvps) {
            if (key !== 'tool_args') {
                kvpsFlat[key] = kvps[key];
            } else if (typeof kvps[key] === 'object' && !Array.isArray(kvps[key])) {
                Object.assign(kvpsFlat, kvps[key]);
            }
        }
        drawKvps(messageDiv, kvpsFlat);
    }

    const textNode = document.createElement('pre');
    textNode.textContent = content;
    textNode.style.whiteSpace = 'pre-wrap';
    textNode.style.wordBreak = 'break-word';
    textNode.classList.add("msg-json");
    messageDiv.appendChild(textNode);

    messageContainer.appendChild(messageDiv);
    // Start of Selection
    drawKvps(messageDiv, kvps);
}

export function drawMessageResponse(messageContainer: HTMLElement, id: string, type: MessageType, heading: string, content: string, kvps: Kvps = {}) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'message-ai', 'message-agent-response', 'message-fw');

    if (heading) messageDiv.appendChild(document.createElement('h4')).textContent = heading;

    drawKvps(messageDiv, kvps);

    const textNode = document.createElement('pre');
    textNode.textContent = content;
    textNode.style.whiteSpace = 'pre-wrap';
    textNode.style.wordBreak = 'break-word';
    messageDiv.appendChild(textNode);

    messageContainer.appendChild(messageDiv);
}

export function drawMessageDelegation(messageContainer: HTMLElement, id: string, type: MessageType, heading: string, content: string, kvps: Kvps = {}) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'message-ai', 'message-agent', 'message-fw', 'message-agent-delegation');

    if (heading) messageDiv.appendChild(document.createElement('h4')).textContent = heading;

const pars = kvps && typeof kvps["tool_args"] === 'object' && !Array.isArray(kvps["tool_args"]) ? kvps["tool_args"] : { text: "", reset: "" };

drawKvps(messageDiv, { "Thoughts": kvps["thoughts"], "Message": pars["text"], "Reset": pars["reset"] });

const textNode = document.createElement('pre');
textNode.textContent = content;
textNode.style.whiteSpace = 'pre-wrap';
    textNode.style.wordBreak = 'break-word';
    messageDiv.appendChild(textNode);

    messageContainer.appendChild(messageDiv);
}

export function drawMessageUser(messageContainer: HTMLElement, id: string, type: MessageType, heading: string, content: string, kvps: Kvps = {}) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'message-user');

    drawKvps(messageDiv, kvps);

    const textNode = document.createElement('pre');
    textNode.textContent = content;
    textNode.style.whiteSpace = 'pre-wrap';
    textNode.style.wordBreak = 'break-word';
    messageDiv.appendChild(textNode);

    messageContainer.appendChild(messageDiv);
}

export function drawMessageTool(messageContainer: HTMLElement, id: string, type: MessageType, heading: string, content: string, kvps: Kvps = {}) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'message-ai', 'message-tool', 'message-fw');

    if (heading) messageDiv.appendChild(document.createElement('h4')).textContent = heading;

    drawKvps(messageDiv, kvps);

    const textNode = document.createElement('pre');
    textNode.textContent = content;
    textNode.style.whiteSpace = 'pre-wrap';
    textNode.style.wordBreak = 'break-word';
    textNode.classList.add("msg-output");
    messageDiv.appendChild(textNode);

    messageContainer.appendChild(messageDiv);
}

export function drawMessageCodeExe(messageContainer: HTMLElement, id: string, type: MessageType, heading: string, content: string, kvps: Kvps = {}) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'message-ai', 'message-code-exe', 'message-fw');

    if (heading) messageDiv.appendChild(document.createElement('h4')).textContent = heading;

    drawKvps(messageDiv, kvps);

    const textNode = document.createElement('pre');
    textNode.textContent = content;
    textNode.style.whiteSpace = 'pre-wrap';
    textNode.style.wordBreak = 'break-word';
    messageDiv.appendChild(textNode);

    messageContainer.appendChild(messageDiv);
}

export function drawMessageAgentPlain(classes: string[], messageContainer: HTMLElement, id: string, type: MessageType, heading: string, content: string, kvps: Kvps = {}) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'message-ai', ...classes);

    drawKvps(messageDiv, kvps);

    const textNode = document.createElement('pre');
    textNode.textContent = content;
    textNode.style.whiteSpace = 'pre-wrap';
    textNode.style.wordBreak = 'break-word';
    messageDiv.appendChild(textNode);

    messageContainer.appendChild(messageDiv);
}

export function drawMessageAdhoc(messageContainer: HTMLElement, id: string, type: MessageType, heading: string, content: string, kvps: Kvps = {}) {
    return drawMessageAgentPlain(['message-adhoc'], messageContainer, id, type, heading, content, kvps);
}

export function drawMessageInfo(messageContainer: HTMLElement, id: string, type: MessageType, heading: string, content: string, kvps: Kvps = {}) {
    return drawMessageAgentPlain(['message-info'], messageContainer, id, type, heading, content, kvps);
}

export function drawMessageWarning(messageContainer: HTMLElement, id: string, type: MessageType, heading: string, content: string, kvps: Kvps = {}) {
    return drawMessageAgentPlain(['message-warning'], messageContainer, id, type, heading, content, kvps);
}

export function drawMessageError(messageContainer: HTMLElement, id: string, type: MessageType, heading: string, content: string, kvps: Kvps = {}) {
    return drawMessageAgentPlain(['message-error'], messageContainer, id, type, heading, content, kvps);
}

function drawKvps(container: HTMLElement, kvps: Kvps) {
    if (kvps) {
        const table = document.createElement('table');
        table.classList.add('ai-info');
        for (const [key, value] of Object.entries(kvps)) {
            const row = table.insertRow();
            if (key === "thoughts") row.classList.add('msg-thoughts');

            const th = row.insertCell();
            th.textContent = convertToTitleCase(key);
            th.classList.add('kvps-key');

            const td = row.insertCell();
            const pre = document.createElement('pre');

            const val = Array.isArray(value) ? value.join('\n') : value;
            pre.textContent = val ?? '';
            pre.classList.add('kvps-val');
            td.appendChild(pre);
        }
        container.appendChild(table);
    }
}

function convertToTitleCase(str: string): string {
    return str
        .replace(/_/g, ' ')  // Replace underscores with spaces
        .toLowerCase()       // Convert the entire string to lowercase
        .replace(/\b\w/g, match => match.toUpperCase());  // Capitalize the first letter of each word
}
