
// Global variables to hold the state
let originalReadmeContent = "";
let analyzedFileContents = [];
let currentRepoUrl = ""; // To track the currently loaded repo


async function processRepository(repoUrl) {
    currentRepoUrl = repoUrl; 
    originalReadmeContent = "";
    analyzedFileContents = [];
    const repoStructureDiv = document.getElementById('repo-structure');
    const readmeDiv = document.getElementById('readme');
    repoStructureDiv.innerHTML = '<code>Fetching repository tree...</code>';
    readmeDiv.innerHTML = '<em>Loading repository data...</em>';

    let repoPath;
    let branch;

    try {
        const urlObject = new URL(repoUrl);
        // We remove the leading slash and the trailing .git
        repoPath = urlObject.pathname.substring(1).replace(/\.git$/, "");

        const repoCheck = await fetch(`https://api.github.com/repos/${repoPath}`);
        if (!repoCheck.ok) {
            //handles both "Not Found" and rate limit errors from the API
            const errorData = await repoCheck.json();
            const errorMessage = errorData.message || "Repository does not exist or is private";
            showToast(`🚫 ${errorMessage}`);
            repoStructureDiv.innerHTML = '<code>Could not fetch repository.</code>';
            currentRepoUrl = ""; 
            return false;
        }
        
        const repoData = await repoCheck.json();
        branch = repoData.default_branch;

        const contentsRes = await fetch(`https://api.github.com/repos/${repoPath}/git/trees/${branch}?recursive=1`);
        const contentsData = await contentsRes.json();

        if (contentsData.tree) {
            repoStructureDiv.innerHTML = '<code>Building file tree and analyzing key files...</code>';
            const paths = contentsData.tree.map(file => file.path);
            const treeFormatted = generateTreeStructure(paths);
            repoStructureDiv.innerHTML = `<pre><code>${treeFormatted}</code></pre>`;

            const keyFilesToRead = ['package.json', 'requirements.txt', 'pom.xml', 'go.mod', 'pyproject.toml', 'app.py', 'main.py', 'index.js', 'server.js', 'main.go', 'main.java'];
            const filesToAnalyze = contentsData.tree.filter(file => keyFilesToRead.includes(file.path.split('/').pop()) && file.type === 'blob' && file.size < 15000);
            const filePromises = filesToAnalyze.map(file => fetch(`https://raw.githubusercontent.com/${repoPath}/${branch}/${file.path}`).then(res => res.text()).then(text => ({ path: file.path, content: text })));
            analyzedFileContents = await Promise.all(filePromises);
            
            const readmeFile = contentsData.tree.find(file => file.path.toLowerCase() === 'readme.md');

            if (readmeFile) {
                const readmeRes = await fetch(`https://raw.githubusercontent.com/${repoPath}/${branch}/${readmeFile.path}`);
                if (readmeRes.ok) {
                    originalReadmeContent = await readmeRes.text();
                    renderMarkdown(originalReadmeContent);
                }
            } else {
                readmeDiv.innerHTML = "<em>No README.md found in this repo. Ready to generate.</em>";
            }
        }
        return true;
    } catch (error) {
        // This catch block handles network errors i.e if the URL is completely invalid
        console.error(error);
        repoStructureDiv.innerHTML = '<code>Error fetching repository data. Invalid URL?</code>';
        showToast("⚠️ Error fetching repository data. Check the URL and your connection.");
        currentRepoUrl = ""; 
        return false;
    }
}


async function fetchRepo() {
    const repoUrl = document.getElementById('repoUrl').value.trim();
    if (!repoUrl) return showToast("Please enter a repository URL");
    
    await processRepository(repoUrl);
}

async function generateReadmeWithBackend() {
    const repoUrl = document.getElementById('repoUrl').value.trim();
    if (!repoUrl) return showToast("Please enter a repository URL");

    const generateBtn = document.getElementById('generate-btn');
    const readmeDiv = document.getElementById('readme');
    const originalButtonHtml = generateBtn.innerHTML;

    // Start loading animation immediately
    generateBtn.disabled = true;
    generateBtn.innerHTML = `<span class="spinner"></span>Processing...`;
    
    // process the repo first to ensure data is fresh.
    // processRepository will handle its own loading messages.
    const success = await processRepository(repoUrl);
    if (!success) { 
        // If fetching failed, reset the button and stop.
        generateBtn.disabled = false;
        generateBtn.innerHTML = originalButtonHtml;
        return;
    }

    try {
        // After data is fetched, button text to show generation phase , spinner for loading
        generateBtn.innerHTML = `<span class="spinner"></span>Generating...`;
        readmeDiv.innerHTML = `<div class="loader-container"><span class="spinner" style="width: 3em; height: 3em; border-width: 4px;"></span><p>Generating your README, please wait...</p></div>`;

        const repoStructureElement = document.getElementById('repo-structure');
        const repoStructureText = repoStructureElement.innerText || repoStructureElement.textContent;


        const res = await fetch('https://ketaki-readme-generator-backend.onrender.com/generate-readme', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ repo_url: repoUrl, existing_readme: originalReadmeContent, repo_structure: repoStructureText, file_contents: analyzedFileContents })
        });

        if (!res.ok) {
            const err = await res.json();
            showToast(`Error: ${err.detail}`);
            readmeDiv.innerHTML = "<em>An error occurred. Please try again.</em>";
            return;
        }

        const data = await res.json();
        
        let readmeText = data.readme;
        if (readmeText.startsWith("```markdown\n")) {
            readmeText = readmeText.substring(10, readmeText.length - 3).trim();
        } else if (readmeText.startsWith("```")) {
            readmeText = readmeText.substring(3, readmeText.length - 3).trim();
        }
        
        originalReadmeContent = readmeText;
        renderMarkdown(readmeText);

    } catch (error) {
        console.error(error);
        showToast("Error generating README from backend");
        readmeDiv.innerHTML = "<em>A critical error occurred. Check the console.</em>";
    } finally {
        generateBtn.disabled = false;
        generateBtn.innerHTML = originalButtonHtml;
    }
}


function renderMarkdown(content) {
    const readmeDiv = document.getElementById('readme');
    readmeDiv.innerHTML = marked.parse(content);
}

function generateTreeStructure(paths) {
    const tree = {};
    paths.forEach(path => {
        const parts = path.split('/');
        let current = tree;
        parts.forEach((part, index) => {
            if (!current[part]) { current[part] = (index === parts.length - 1) ? null : {}; }
            current = current[part];
        });
    });
    function renderTree(obj, prefix = '') {
        const entries = Object.entries(obj);
        return entries.map((entry, index) => {
            const [name, value] = entry;
            const isLast = index === entries.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            let line = `${prefix}${connector}${name}`;
            if (value && typeof value === 'object') {
                line += '\n' + renderTree(value, prefix + (isLast ? '    ' : '│   '));
            }
            return line;
        }).join('\n');
    }
    return renderTree(tree);
}

function editReadme() {
    const readmeDiv = document.getElementById('readme');
    const textarea = document.createElement('textarea');
    textarea.value = originalReadmeContent || "";
    textarea.style.width = "100%";
    textarea.style.height = "300px";
    const saveBtn = document.createElement('button');
    saveBtn.textContent = "Save";
    saveBtn.onclick = () => {
        originalReadmeContent = textarea.value;
        renderMarkdown(originalReadmeContent);
    };
    readmeDiv.innerHTML = "";
    readmeDiv.appendChild(textarea);
    readmeDiv.appendChild(saveBtn);
}

function copyReadme() {
    navigator.clipboard.writeText(originalReadmeContent || "");
    showToast("✅ Copied to clipboard!");
}

function downloadReadme() {
    const blob = new Blob([originalReadmeContent || ""], { type: "text/markdown" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "README.md";
    link.click();
}

function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, duration);
}
