/* global crypto, document, fetch, localStorage, URL, window */

const MAX_BLOCKS = 20;
const PROJECT_STORAGE_KEY = "page-builder.projectId";
const PALETTE_DRAG_TYPE = "application/x-page-builder-block-type";
const BLOCK_DRAG_TYPE = "application/x-page-builder-block-id";

const blockDefaults = {
  heading: () => ({ id: crypto.randomUUID(), type: "heading", text: "New heading", level: 2 }),
  text: () => ({ id: crypto.randomUUID(), type: "text", text: "Write your text here." }),
  button: () => ({ id: crypto.randomUUID(), type: "button", label: "Learn more", url: "https://example.com" }),
  section: () => ({ id: crypto.randomUUID(), type: "section", title: "New section" })
};

const elements = {
  canvas: document.querySelector("#canvas"),
  canvasHelp: document.querySelector("#canvas-help"),
  inspectorFields: document.querySelector("#inspector-fields"),
  loadProject: document.querySelector("#load-project"),
  openPublished: document.querySelector("#open-published"),
  palette: document.querySelector("#palette"),
  projectName: document.querySelector("#project-name"),
  projectSlug: document.querySelector("#project-slug"),
  publishProject: document.querySelector("#publish-project"),
  removeSelected: document.querySelector("#remove-selected"),
  saveProject: document.querySelector("#save-project"),
  status: document.querySelector("#status")
};

const state = {
  blocks: [],
  projectId: null,
  selectedBlockId: null
};

function setStatus(message) {
  elements.status.textContent = message;
}

function previewElement(block) {
  if (block.type === "heading") {
    const heading = document.createElement(`h${block.level}`);
    heading.textContent = block.text;
    return heading;
  }

  if (block.type === "text") {
    const paragraph = document.createElement("p");
    paragraph.textContent = block.text;
    return paragraph;
  }

  if (block.type === "button") {
    const buttonPreview = document.createElement("span");
    buttonPreview.className = "preview-link";
    buttonPreview.textContent = block.label;
    return buttonPreview;
  }

  const section = document.createElement("section");
  const heading = document.createElement("h2");
  heading.textContent = block.title;
  section.append(heading);
  return section;
}

function selectedBlock() {
  return state.blocks.find((block) => block.id === state.selectedBlockId) ?? null;
}

function blockElement(blockId) {
  return [...elements.canvas.querySelectorAll(".canvas-block")]
    .find((candidate) => candidate.dataset.blockId === blockId) ?? null;
}

function updateBlockPreview(block) {
  const element = blockElement(block.id);
  if (!element) return;
  element.replaceChildren(previewElement(block));
}

function createField(labelText, control) {
  const wrapper = document.createElement("div");
  wrapper.className = "field-stack";
  const label = document.createElement("label");
  label.htmlFor = control.id;
  label.textContent = labelText;
  wrapper.append(label, control);
  return wrapper;
}

function createTextInput(id, value) {
  const input = document.createElement("input");
  input.id = id;
  input.type = "text";
  input.value = value;
  return input;
}

function appendHeadingFields(block) {
  const textInput = createTextInput("block-text", block.text);
  textInput.addEventListener("input", () => {
    block.text = textInput.value;
    updateBlockPreview(block);
  });

  const levelSelect = document.createElement("select");
  levelSelect.id = "block-level";
  for (const level of [1, 2, 3]) {
    const option = document.createElement("option");
    option.value = String(level);
    option.textContent = `Heading ${level}`;
    option.selected = block.level === level;
    levelSelect.append(option);
  }
  levelSelect.addEventListener("change", () => {
    block.level = Number(levelSelect.value);
    updateBlockPreview(block);
  });

  elements.inspectorFields.append(
    createField("Text", textInput),
    createField("Level", levelSelect)
  );
}

function appendTextFields(block) {
  const textarea = document.createElement("textarea");
  textarea.id = "block-text";
  textarea.value = block.text;
  textarea.addEventListener("input", () => {
    block.text = textarea.value;
    updateBlockPreview(block);
  });
  elements.inspectorFields.append(createField("Text", textarea));
}

function appendButtonFields(block) {
  const labelInput = createTextInput("block-label", block.label);
  labelInput.addEventListener("input", () => {
    block.label = labelInput.value;
    updateBlockPreview(block);
  });

  const urlInput = document.createElement("input");
  urlInput.id = "block-url";
  urlInput.type = "url";
  urlInput.value = block.url;
  urlInput.addEventListener("input", () => {
    block.url = urlInput.value;
  });

  elements.inspectorFields.append(
    createField("Label", labelInput),
    createField("URL", urlInput)
  );
}

function appendSectionFields(block) {
  const titleInput = createTextInput("block-title", block.title);
  titleInput.addEventListener("input", () => {
    block.title = titleInput.value;
    updateBlockPreview(block);
  });
  elements.inspectorFields.append(createField("Title", titleInput));
}

function renderInspector() {
  elements.inspectorFields.replaceChildren();
  const block = selectedBlock();
  elements.removeSelected.disabled = block === null;

  if (!block) {
    const message = document.createElement("p");
    message.className = "muted-copy";
    message.textContent = "Select a block to edit its content.";
    elements.inspectorFields.append(message);
    return;
  }

  if (block.type === "heading") appendHeadingFields(block);
  if (block.type === "text") appendTextFields(block);
  if (block.type === "button") appendButtonFields(block);
  if (block.type === "section") appendSectionFields(block);
}

function renderCanvas() {
  for (const existingBlock of elements.canvas.querySelectorAll(".canvas-block")) {
    existingBlock.remove();
  }
  elements.canvasHelp.hidden = state.blocks.length > 0;

  for (const block of state.blocks) {
    const blockElement = document.createElement("article");
    blockElement.className = "canvas-block";
    blockElement.dataset.blockId = block.id;
    blockElement.dataset.blockType = block.type;
    blockElement.draggable = true;
    blockElement.tabIndex = 0;
    blockElement.setAttribute("aria-current", String(block.id === state.selectedBlockId));
    blockElement.setAttribute("aria-label", `${block.type[0].toUpperCase()}${block.type.slice(1)} block`);
    blockElement.append(previewElement(block));
    elements.canvas.append(blockElement);
  }
}

function render() {
  renderCanvas();
  renderInspector();
}

function insertionIndex(targetBlock) {
  if (!targetBlock) return state.blocks.length;
  return state.blocks.findIndex((block) => block.id === targetBlock.dataset.blockId);
}

function addBlock(type, index = state.blocks.length) {
  const createBlock = blockDefaults[type];
  if (!createBlock) return;
  if (state.blocks.length >= MAX_BLOCKS) {
    setStatus("Block limit reached. Remove a block before adding another.");
    return;
  }

  const block = createBlock();
  state.blocks.splice(Math.max(0, index), 0, block);
  state.selectedBlockId = block.id;
  render();
  setStatus(`${type[0].toUpperCase()}${type.slice(1)} added.`);
}

function selectBlock(blockId) {
  if (!state.blocks.some((block) => block.id === blockId)) return;
  state.selectedBlockId = blockId;
  render();
}

function reorderBlock(sourceId, targetId) {
  const before = state.blocks.map((block) => block.id).join(",");
  const sourceIndex = state.blocks.findIndex((block) => block.id === sourceId);
  if (sourceIndex < 0 || sourceId === targetId) return;

  const [movedBlock] = state.blocks.splice(sourceIndex, 1);
  const targetIndex = targetId
    ? state.blocks.findIndex((block) => block.id === targetId)
    : state.blocks.length;
  state.blocks.splice(targetIndex < 0 ? state.blocks.length : targetIndex, 0, movedBlock);

  const after = state.blocks.map((block) => block.id).join(",");
  if (before === after) return;
  state.selectedBlockId = null;
  render();
  setStatus("Block moved.");
}

function removeSelectedBlock() {
  const index = state.blocks.findIndex((block) => block.id === state.selectedBlockId);
  if (index < 0) return;
  state.blocks.splice(index, 1);
  state.selectedBlockId = null;
  render();
  setStatus("Block removed.");
}

function rememberProjectId(projectId) {
  try {
    localStorage.setItem(PROJECT_STORAGE_KEY, projectId);
  } catch {
    // Saving still works when persistent browser storage is unavailable.
  }
}

function storedProjectId() {
  try {
    return localStorage.getItem(PROJECT_STORAGE_KEY);
  } catch {
    return null;
  }
}

function setProjectLocation(projectId) {
  const url = new URL(window.location.href);
  url.searchParams.set("project", projectId);
  window.history.replaceState(null, "", url);
}

function showPublishedLink(url) {
  elements.openPublished.setAttribute("href", url);
  elements.openPublished.hidden = false;
}

function hidePublishedLink() {
  elements.openPublished.hidden = true;
  elements.openPublished.removeAttribute("href");
}

function applyProject(project, preserveSelection = false) {
  if (!project || !Array.isArray(project.blocks)) throw new Error("The project response is invalid");
  if (project.blocks.length > MAX_BLOCKS) {
    throw new Error(`This project has more than ${MAX_BLOCKS} blocks`);
  }

  const selectedId = preserveSelection ? state.selectedBlockId : null;
  state.projectId = project.id;
  state.blocks = project.blocks.map((block) => ({ ...block }));
  state.selectedBlockId = state.blocks.some((block) => block.id === selectedId) ? selectedId : null;
  elements.projectName.value = project.name;
  elements.projectSlug.value = project.slug;
  elements.loadProject.disabled = false;
  if (project.publishedAt) showPublishedLink(`/sites/${project.slug}`);
  else hidePublishedLink();
  rememberProjectId(project.id);
  setProjectLocation(project.id);
  render();
}

async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: options.body
      ? { "content-type": "application/json", ...options.headers }
      : options.headers
  });

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const message = body && typeof body.message === "string"
      ? body.message
      : `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return body;
}

function projectPayload() {
  const fieldsAreValid = elements.projectName.checkValidity() && elements.projectSlug.checkValidity();
  if (!fieldsAreValid) {
    elements.projectName.reportValidity();
    elements.projectSlug.reportValidity();
    setStatus("Enter a valid project name and slug.");
    return null;
  }

  return {
    name: elements.projectName.value,
    slug: elements.projectSlug.value,
    blocks: state.blocks
  };
}

function requestError(action, error) {
  const message = error instanceof Error ? error.message : "Unknown error";
  setStatus(`${action} failed: ${message}`);
}

async function saveProject() {
  const payload = projectPayload();
  if (!payload) return;

  try {
    const path = state.projectId ? `/api/projects/${state.projectId}` : "/api/projects";
    const project = await requestJson(path, {
      method: state.projectId ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });
    applyProject(project, true);
    setStatus("Project saved.");
  } catch (error) {
    requestError("Save", error);
  }
}

async function loadProject() {
  if (!state.projectId) {
    setStatus("No saved project is available to load.");
    return;
  }

  try {
    const project = await requestJson(`/api/projects/${state.projectId}`);
    applyProject(project);
    setStatus("Project loaded.");
  } catch (error) {
    requestError("Load", error);
  }
}

async function publishProject() {
  if (!state.projectId) {
    setStatus("Save the project before publishing.");
    return;
  }

  try {
    const result = await requestJson(`/api/projects/${state.projectId}/publish`, { method: "POST" });
    const project = result && result.project ? result.project : result;
    if (project && project.id) applyProject(project, true);
    const publicUrl = result && typeof result.url === "string"
      ? result.url
      : `/sites/${elements.projectSlug.value}`;
    showPublishedLink(publicUrl);
    setStatus("Published.");
  } catch (error) {
    requestError("Publish", error);
  }
}

elements.palette.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-palette-type]");
  if (!button) return;
  addBlock(button.dataset.paletteType);
});

elements.palette.addEventListener("dragstart", (event) => {
  const button = event.target.closest("button[data-palette-type]");
  if (!button || !event.dataTransfer) return;
  event.dataTransfer.effectAllowed = "copy";
  event.dataTransfer.setData(PALETTE_DRAG_TYPE, button.dataset.paletteType);
});

elements.canvas.addEventListener("click", (event) => {
  const block = event.target.closest(".canvas-block");
  if (block) selectBlock(block.dataset.blockId);
});

elements.canvas.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const block = event.target.closest(".canvas-block");
  if (!block) return;
  event.preventDefault();
  selectBlock(block.dataset.blockId);
});

elements.canvas.addEventListener("dragstart", (event) => {
  const block = event.target.closest(".canvas-block");
  if (!block || !event.dataTransfer) return;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData(BLOCK_DRAG_TYPE, block.dataset.blockId);
  block.classList.add("is-dragging");
});

elements.canvas.addEventListener("dragend", () => {
  for (const block of elements.canvas.querySelectorAll(".is-dragging")) {
    block.classList.remove("is-dragging");
  }
  elements.canvas.classList.remove("is-drop-target");
});

elements.canvas.addEventListener("dragover", (event) => {
  if (!event.dataTransfer) return;
  const supportedDrag = event.dataTransfer.types.includes(PALETTE_DRAG_TYPE)
    || event.dataTransfer.types.includes(BLOCK_DRAG_TYPE);
  if (!supportedDrag) return;
  event.preventDefault();
  elements.canvas.classList.add("is-drop-target");
});

elements.canvas.addEventListener("dragleave", (event) => {
  if (!elements.canvas.contains(event.relatedTarget)) {
    elements.canvas.classList.remove("is-drop-target");
  }
});

elements.canvas.addEventListener("drop", (event) => {
  if (!event.dataTransfer) return;
  const targetBlock = event.target.closest(".canvas-block");
  const paletteType = event.dataTransfer.getData(PALETTE_DRAG_TYPE);
  const sourceId = event.dataTransfer.getData(BLOCK_DRAG_TYPE);
  if (!paletteType && !sourceId) return;
  event.preventDefault();
  elements.canvas.classList.remove("is-drop-target");

  if (paletteType) addBlock(paletteType, insertionIndex(targetBlock));
  if (sourceId) reorderBlock(sourceId, targetBlock ? targetBlock.dataset.blockId : null);
});

elements.removeSelected.addEventListener("click", removeSelectedBlock);
elements.saveProject.addEventListener("click", () => {
  void saveProject();
});
elements.loadProject.addEventListener("click", () => {
  void loadProject();
});
elements.publishProject.addEventListener("click", () => {
  void publishProject();
});

render();

const queryProjectId = new URL(window.location.href).searchParams.get("project");
const initialProjectId = queryProjectId || storedProjectId();
if (initialProjectId) {
  state.projectId = initialProjectId;
  elements.loadProject.disabled = false;
  void loadProject();
}
