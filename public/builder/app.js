/* global crypto, document, fetch, localStorage, URL, window */

const MAX_BLOCKS = 20;
const PROJECT_STORAGE_KEY = "page-builder.projectId";
const PALETTE_DRAG_TYPE = "application/x-page-builder-block-type";
const BLOCK_DRAG_TYPE = "application/x-page-builder-block-id";

const IMAGE_PLACEHOLDER = `data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='600' height='300'>"
  + "<rect width='100%' height='100%' fill='#e8ecea'/>"
  + "<text x='50%' y='50%' fill='#63706a' font-family='sans-serif' font-size='22' "
  + "text-anchor='middle' dominant-baseline='middle'>Image — paste a URL in the inspector</text></svg>"
)}`;

const blockDefaults = {
  heading: () => ({ id: crypto.randomUUID(), type: "heading", text: "New heading", level: 2 }),
  text: () => ({ id: crypto.randomUUID(), type: "text", text: "Write your text here." }),
  button: () => ({ id: crypto.randomUUID(), type: "button", label: "Learn more", url: "https://example.com", style: "primary" }),
  section: () => ({ id: crypto.randomUUID(), type: "section", title: "New section" }),
  divider: () => ({ id: crypto.randomUUID(), type: "divider" }),
  quote: () => ({ id: crypto.randomUUID(), type: "quote", quote: "New quote", attribution: "" }),
  image: () => ({ id: crypto.randomUUID(), type: "image", url: IMAGE_PLACEHOLDER, alt: "" }),
  spacer: () => ({ id: crypto.randomUUID(), type: "spacer", size: "medium" })
};

const SPACER_HEIGHTS = { small: 16, medium: 40, large: 80 };

const elements = {
  canvas: document.querySelector("#canvas"),
  canvasHelp: document.querySelector("#canvas-help"),
  inspectorFields: document.querySelector("#inspector-fields"),
  loadProject: document.querySelector("#load-project"),
  moveSelectedDown: document.querySelector("#move-selected-down"),
  moveSelectedUp: document.querySelector("#move-selected-up"),
  openPublished: document.querySelector("#open-published"),
  palette: document.querySelector("#palette"),
  projectName: document.querySelector("#project-name"),
  projectTitle: document.querySelector("#project-title-input"),
  projectSlug: document.querySelector("#project-slug"),
  publishProject: document.querySelector("#publish-project"),
  removeSelected: document.querySelector("#remove-selected"),
  duplicateSelected: document.querySelector("#duplicate-selected"),
  saveProject: document.querySelector("#save-project"),
  status: document.querySelector("#status")
};

const state = {
  blocks: [],
  projectId: null,
  selectedBlockId: null,
  savedName: null
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
    const style = block.style === "secondary" ? "secondary" : "primary";
    buttonPreview.className = `preview-link preview-link-${style}`;
    buttonPreview.textContent = block.label;
    return buttonPreview;
  }

  if (block.type === "divider") {
    return document.createElement("hr");
  }

  if (block.type === "quote") {
    const blockquote = document.createElement("blockquote");
    const quoteText = document.createElement("p");
    quoteText.textContent = block.quote;
    blockquote.append(quoteText);
    if (block.attribution.trim()) {
      const cite = document.createElement("cite");
      cite.textContent = block.attribution;
      blockquote.append(cite);
    }
    return blockquote;
  }

  if (block.type === "image") {
    const image = document.createElement("img");
    image.src = block.url;
    image.alt = block.alt;
    image.className = "preview-image";
    return image;
  }

  if (block.type === "spacer") {
    const spacer = document.createElement("div");
    spacer.className = "preview-spacer";
    spacer.style.height = `${SPACER_HEIGHTS[block.size]}px`;
    spacer.setAttribute("aria-hidden", "true");
    return spacer;
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

  const styleSelect = document.createElement("select");
  styleSelect.id = "block-button-style";
  for (const style of ["primary", "secondary"]) {
    const option = document.createElement("option");
    option.value = style;
    option.textContent = `${style[0].toUpperCase()}${style.slice(1)}`;
    option.selected = (block.style ?? "primary") === style;
    styleSelect.append(option);
  }
  styleSelect.addEventListener("change", () => {
    block.style = styleSelect.value;
    updateBlockPreview(block);
  });

  elements.inspectorFields.append(
    createField("Label", labelInput),
    createField("URL", urlInput),
    createField("Style", styleSelect)
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

function appendQuoteFields(block) {
  const quoteInput = document.createElement("textarea");
  quoteInput.id = "block-quote";
  quoteInput.value = block.quote;
  quoteInput.addEventListener("input", () => {
    block.quote = quoteInput.value;
    updateBlockPreview(block);
  });

  const attributionInput = createTextInput("block-attribution", block.attribution);
  attributionInput.addEventListener("input", () => {
    block.attribution = attributionInput.value;
    updateBlockPreview(block);
  });

  elements.inspectorFields.append(
    createField("Quote", quoteInput),
    createField("Attribution", attributionInput)
  );
}

function appendImageFields(block) {
  const urlInput = document.createElement("input");
  urlInput.id = "block-image-url";
  urlInput.type = "url";
  urlInput.value = block.url;
  urlInput.addEventListener("input", () => {
    block.url = urlInput.value;
    updateBlockPreview(block);
  });

  const altInput = createTextInput("block-image-alt", block.alt);
  altInput.required = true;
  altInput.addEventListener("input", () => {
    block.alt = altInput.value;
    updateBlockPreview(block);
  });

  elements.inspectorFields.append(
    createField("Image URL", urlInput),
    createField("Alt text", altInput)
  );
}

function appendSpacerFields(block) {
  const sizeSelect = document.createElement("select");
  sizeSelect.id = "block-spacer-size";
  for (const size of ["small", "medium", "large"]) {
    const option = document.createElement("option");
    option.value = size;
    option.textContent = `${size[0].toUpperCase()}${size.slice(1)}`;
    option.selected = block.size === size;
    sizeSelect.append(option);
  }
  sizeSelect.addEventListener("change", () => {
    block.size = sizeSelect.value;
    updateBlockPreview(block);
  });
  elements.inspectorFields.append(createField("Size", sizeSelect));
}

function renderInspector() {
  elements.inspectorFields.replaceChildren();
  const block = selectedBlock();
  elements.removeSelected.disabled = block === null;
  elements.duplicateSelected.disabled = block === null;
  const selectedIndex = state.blocks.findIndex((candidate) => candidate.id === state.selectedBlockId);
  elements.moveSelectedUp.disabled = selectedIndex <= 0;
  elements.moveSelectedDown.disabled = selectedIndex < 0 || selectedIndex === state.blocks.length - 1;

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
  if (block.type === "quote") appendQuoteFields(block);
  if (block.type === "image") appendImageFields(block);
  if (block.type === "spacer") appendSpacerFields(block);
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

function moveSelectedBlock(offset) {
  const sourceIndex = state.blocks.findIndex((block) => block.id === state.selectedBlockId);
  const targetIndex = sourceIndex + offset;
  if (sourceIndex < 0 || targetIndex < 0 || targetIndex >= state.blocks.length) return;

  [state.blocks[sourceIndex], state.blocks[targetIndex]] = [
    state.blocks[targetIndex],
    state.blocks[sourceIndex]
  ];
  render();
  setStatus("Block moved.");
}

function duplicateSelectedBlock() {
  const index = state.blocks.findIndex((block) => block.id === state.selectedBlockId);
  if (index < 0) return;
  if (state.blocks.length >= MAX_BLOCKS) {
    setStatus("Block limit reached. Remove a block before adding another.");
    return;
  }
  const copy = { ...state.blocks[index], id: crypto.randomUUID() };
  state.blocks.splice(index + 1, 0, copy);
  state.selectedBlockId = copy.id;
  render();
  setStatus("Block duplicated.");
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
  state.savedName = project.name;
  state.blocks = project.blocks.map((block) => ({ ...block }));
  state.selectedBlockId = state.blocks.some((block) => block.id === selectedId) ? selectedId : null;
  elements.projectName.value = project.name;
  elements.projectTitle.value = project.name;
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

function firstImageMissingAlt() {
  return state.blocks.find((block) => block.type === "image" && block.alt.trim() === "") ?? null;
}

async function saveProject() {
  const missingAlt = firstImageMissingAlt();
  if (missingAlt) {
    selectBlock(missingAlt.id);
    setStatus("Add alt text to every image before saving.");
    return;
  }

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

async function commitTitleRename() {
  const name = elements.projectTitle.value.trim();
  if (name === "") {
    setStatus("Enter a valid project name and slug.");
    return;
  }
  if (name === state.savedName) return;
  // A never-saved project has no id to rename against; fall back to a full save.
  if (!state.projectId) {
    void saveProject();
    return;
  }

  try {
    const project = await requestJson(`/api/projects/${state.projectId}/name`, {
      method: "PATCH",
      body: JSON.stringify({ name })
    });
    state.savedName = project.name;
    elements.projectName.value = project.name;
    elements.projectTitle.value = project.name;
    setStatus("Project renamed.");
  } catch (error) {
    requestError("Rename", error);
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

  const missingAlt = firstImageMissingAlt();
  if (missingAlt) {
    selectBlock(missingAlt.id);
    setStatus("Add alt text to every image before publishing.");
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
elements.duplicateSelected.addEventListener("click", duplicateSelectedBlock);
elements.moveSelectedUp.addEventListener("click", () => moveSelectedBlock(-1));
elements.moveSelectedDown.addEventListener("click", () => moveSelectedBlock(1));
elements.projectTitle.addEventListener("input", () => {
  elements.projectName.value = elements.projectTitle.value;
  if (elements.projectName.value.trim() === "") {
    setStatus("Enter a valid project name and slug.");
    return;
  }
  setStatus("Unsaved changes.");
});
elements.projectName.addEventListener("input", () => {
  elements.projectTitle.value = elements.projectName.value;
});
elements.projectTitle.addEventListener("blur", () => {
  void commitTitleRename();
});
elements.projectTitle.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  void commitTitleRename();
});
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
state.savedName = elements.projectName.value;

const queryProjectId = new URL(window.location.href).searchParams.get("project");
const initialProjectId = queryProjectId || storedProjectId();
if (initialProjectId) {
  state.projectId = initialProjectId;
  elements.loadProject.disabled = false;
  void loadProject();
}
