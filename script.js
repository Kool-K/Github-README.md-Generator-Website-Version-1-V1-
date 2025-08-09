let originalReadmeContent = "";

async function fetchRepo() {
    const repoUrl = document.getElementById('repoUrl').value.trim();
    if (!repoUrl) return showToast("Please enter a repository URL");

    const repoPath = repoUrl.replace("https://github.com/", "").replace(".git", "");
    let branch = "main";

    try {
        // First, check if repo exists
        const repoCheck = await fetch(`https://api.github.com/repos/${repoPath}`);
        if (!repoCheck.ok) {
            showToast("🚫 Repository does not exist");
            return;
        }

        let branchCheck = await fetch(`https://api.github.com/repos/${repoPath}/branches/main`);
        if (!branchCheck.ok) {
            branchCheck = await fetch(`https://api.github.com/repos/${repoPath}/branches/master`);
            if (branchCheck.ok) branch = "master";
        }

        const contentsRes = await fetch(`https://api.github.com/repos/${repoPath}/git/trees/${branch}?recursive=1`);
        const contentsData = await contentsRes.json();

        if (contentsData.tree) {
            const paths = contentsData.tree.map(file => file.path);

            function generateTreeStructure(paths) {
                const tree = {};

                // Build nested object from file paths
                paths.forEach(path => {
                    const parts = path.split('/');
                    let current = tree;
                    parts.forEach((part, index) => {
                        if (!current[part]) {
                            current[part] = (index === parts.length - 1) ? null : {};
                        }
                        current = current[part];
                    });
                });

                // Render ASCII tree with dotted lines
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

            const treeFormatted = generateTreeStructure(paths);

            document.getElementById('repo-structure').innerHTML =
                `<pre><code>${treeFormatted}</code></pre>`;
        }


        const readmeRes = await fetch(`https://raw.githubusercontent.com/${repoPath}/${branch}/README.md`);
        if (readmeRes.ok) {
            originalReadmeContent = await readmeRes.text();
            renderMarkdown(originalReadmeContent);
        } else {
            document.getElementById('readme').innerHTML = "<em>No README.md found in this repo.</em>";
        }
    } catch (error) {
        console.error(error);
        showToast("⚠️ Error fetching repository data");
    }
}

// script.js

// script.js

async function generateReadmeWithBackend() {
    const repoUrl = document.getElementById('repoUrl').value.trim();
    if (!repoUrl) return showToast("Please enter a repository URL");

    // Get references to the UI elements we'll be changing
    const generateBtn = document.getElementById('generate-btn');
    const readmeDiv = document.getElementById('readme');
    const originalButtonHtml = generateBtn.innerHTML; // Save the original button text

    try {
        // --- START LOADING STATE ---
        generateBtn.disabled = true;
        generateBtn.innerHTML = `<span class="spinner"></span>Generating...`;
        readmeDiv.innerHTML = `
            <div class="loader-container">
                <span class="spinner" style="width: 3em; height: 3em; border-width: 4px;"></span>
                <p>Generating your README, please wait...</p>
            </div>
        `;

        const existingReadme = originalReadmeContent || null;
        const repoStructure = document.getElementById('repo-structure').innerText;

        const res = await fetch('http://localhost:8000/generate-readme', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                repo_url: repoUrl,
                existing_readme: existingReadme,
                repo_structure: repoStructure
            })
        });

        if (!res.ok) {
            const err = await res.json();
            showToast(`Error: ${err.detail}`);
            // If there's an error, clear the loading message
            readmeDiv.innerHTML = "<em>An error occurred. Please try again.</em>";
            return;
        }

        const data = await res.json();
        originalReadmeContent = data.readme;
        renderMarkdown(data.readme);

    } catch (error) {
        console.error(error);
        showToast("Error generating README from backend");
        readmeDiv.innerHTML = "<em>A critical error occurred. Check the console.</em>";
    } finally {
        // --- END LOADING STATE ---
        // This block runs no matter what, ensuring the button is always re-enabled.
        generateBtn.disabled = false;
        generateBtn.innerHTML = originalButtonHtml;
    }
}

function renderMarkdown(content) {
    const readmeDiv = document.getElementById('readme');
    readmeDiv.innerHTML = marked.parse(content);
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
    alert("README copied to clipboard");
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
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}



