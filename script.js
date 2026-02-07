// Elements
const runBtn = document.getElementById("runBtn");
const preview = document.getElementById("preview");
const previewDesktop = document.getElementById("previewDesktop");
const tabs = document.querySelectorAll(".tab");
const autorun = document.getElementById("autorun");
const sampleBtn = document.getElementById("sampleBtn");
const downloadBtn = document.getElementById("downloadBtn");
const zipBtn = document.getElementById("zipBtn");
const openInNew = document.getElementById("openInNew");
const clearOutput = document.getElementById("clearOutput");
const openInNewDesktop = document.getElementById("openInNewDesktop");
const clearOutputDesktop = document.getElementById("clearOutputDesktop");
const divider = document.getElementById("divider");

// Initialize CodeMirror editors
const htmlEditor = CodeMirror.fromTextArea(document.getElementById("htmlEditor"), {
  mode: "xml",
  theme: "material-darker",
  lineNumbers: true,
  htmlMode: true
});
const cssEditor = CodeMirror.fromTextArea(document.getElementById("cssEditor"), {
  mode: "css",
  theme: "material-darker",
  lineNumbers: true
});
const jsEditor = CodeMirror.fromTextArea(document.getElementById("jsEditor"), {
  mode: "javascript",
  theme: "material-darker",
  lineNumbers: true
});

// Sample boilerplate
const sampleHTML = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Demo</title>
</head>
<body>
  <h1>Hello World</h1>
  <p>This is a demo from MiniCompiler.</p>
  <button id="clickMe">Click me</button>
</body>
</html>`;
const sampleCSS = `body{font-family:system-ui;padding:24px;background:#f4f7fb;color:#1a202c}
h1{color:#2563eb}
button{padding:8px 12px;border-radius:6px}`;
const sampleJS = `document.getElementById('clickMe')?.addEventListener('click',()=>alert('Hello from JS!'));`;

htmlEditor.setValue(sampleHTML);
cssEditor.setValue(sampleCSS);
jsEditor.setValue(sampleJS);

// Tab switching
tabs.forEach(t => t.addEventListener("click", () => {
  document.querySelector(".tab.active").classList.remove("active");
  t.classList.add("active");

  const mode = t.dataset.mode;
  htmlEditor.getWrapperElement().style.display = mode === "html" ? "block" : "none";
  cssEditor.getWrapperElement().style.display = mode === "css" ? "block" : "none";
  jsEditor.getWrapperElement().style.display = mode === "js" ? "block" : "none";

  // refresh editors so they render correctly when shown
  [htmlEditor, cssEditor, jsEditor].forEach(ed => ed.refresh());
}));


function run() {
    const html = editors.html.getValue();
    const css = editors.css.getValue();
    const js = editors.js.getValue();

    const previewFrame = document.getElementById("preview");
    
    const source = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                /* Force a clean, non-transparent background */
                html, body { 
                    background-color: #ffffff !important; 
                    opacity: 1 !important;
                    filter: none !important;
                }
                
                /* This is your code from the CSS tab */
                ${css}
            </style>
        </head>
        <body>
            ${html}
            <script>${js}<\/script>
        </body>
        </html>
    `;
    previewFrame.srcdoc = source;
}

// Build output
function buildAndRun() {
  const css = `<style>${cssEditor.getValue()}</style>`;
  const js = `<script>${jsEditor.getValue()}<\/script>`;
  let html = htmlEditor.getValue();

  if (/<\/head>/i.test(html)) {
    html = html.replace(/<\/head>/i, css + "\n</head>");
  } else {
    html = html.replace(/<html.*?>/i, "$&<head>" + css + "</head>");
  }

  if (/<\/body>/i.test(html)) {
    html = html.replace(/<\/body>/i, js + "\n</body>");
  } else {
    html += js;
  }

  preview.srcdoc = html;
  previewDesktop.srcdoc = html;
}
runBtn.addEventListener("click", buildAndRun);

// Autorun with debounce
let debounce;
[htmlEditor, cssEditor, jsEditor].forEach(ed =>
  ed.on("change", () => {
    if (!autorun.checked) return;
    clearTimeout(debounce);
    debounce = setTimeout(buildAndRun, 600);
  })
);
autorun.addEventListener("change", () => {
  if (autorun.checked) buildAndRun();
});

// Sample loader
sampleBtn.addEventListener("click", () => {
  if (!confirm("Replace with sample code?")) return;
  htmlEditor.setValue(sampleHTML);
  cssEditor.setValue(sampleCSS);
  jsEditor.setValue(sampleJS);
  buildAndRun();
});

// Download HTML + CSS + JS files individually
downloadBtn.addEventListener("click", () => {
  const files = [
    { name: "index.html", content: htmlEditor.getValue(), type: "text/html" },
    { name: "style.css", content: cssEditor.getValue(), type: "text/css" },
    { name: "script.js", content: jsEditor.getValue(), type: "application/javascript" }
  ];
  files.forEach(f => {
    const blob = new Blob([f.content], { type: f.type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = f.name;
    a.click();
    URL.revokeObjectURL(url);
  });
});

// Export ZIP safely (avoid nested <html>)
zipBtn.addEventListener("click", () => {
  const zip = new JSZip();

  // Extract body content only
  const bodyContent = htmlEditor.getValue()
    .replace(/^[\s\S]*<body[^>]*>/i, "")
    .replace(/<\/body>[\s\S]*$/i, "");

  const indexHTML = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Project</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
${bodyContent}
<script src="script.js"></script>
</body>
</html>`;

  zip.file("index.html", indexHTML);
  zip.file("style.css", cssEditor.getValue());
  zip.file("script.js", jsEditor.getValue());

  zip.generateAsync({ type: "blob" }).then(content => {
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = "project.zip";
    a.click();
    URL.revokeObjectURL(url);
  });
});

// Open/clear output with blob URLs
function openPreview(srcdoc) {
  const blob = new Blob([srcdoc], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
openInNew.addEventListener("click", () => openPreview(preview.srcdoc));
openInNewDesktop.addEventListener("click", () => openPreview(previewDesktop.srcdoc));

clearOutput.addEventListener("click", () => { preview.srcdoc = "<!doctype html><html><body></body></html>"; });
clearOutputDesktop.addEventListener("click", () => { previewDesktop.srcdoc = "<!doctype html><html><body></body></html>"; });

// Resizing divider (requires .container as grid in CSS)
// Resizing divider
let dragging = false;

divider.addEventListener("mousedown", () => {
  dragging = true;
  document.body.style.cursor = "col-resize";
});

window.addEventListener("mouseup", () => {
  dragging = false;
  document.body.style.cursor = "";
});

window.addEventListener("mousemove", e => {
  if (!dragging) return;
  const container = document.querySelector(".container");
  const rect = container.getBoundingClientRect();
  const offset = e.clientX - rect.left;
  if (offset < 200 || rect.width - offset < 200) return;
  container.style.gridTemplateColumns = `${offset}px 6px ${rect.width - offset - 6}px`;
});


// Mobile tab switching
const mobileTabs = document.querySelectorAll(".mobile-tab");
const mobilePanes = document.querySelectorAll(".mobile-pane");
mobileTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelector(".mobile-tab.active").classList.remove("active");
    tab.classList.add("active");
    mobilePanes.forEach(p => p.classList.remove("active"));
    document.getElementById(tab.dataset.target).classList.add("active");
  });
});

// Initial run
buildAndRun();
