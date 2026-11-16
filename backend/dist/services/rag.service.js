import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { summarizeGithubRepository } from './github.service.js';
import { readGithubFile } from './github-browser.service.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://127.0.0.1:8001';
/**
 * Gather rich multi-source context (Code + GitHub API + README + AST + Manifests)
 */
async function compileRepositoryContext(workspace) {
    const files = [];
    // 1. Existing local source files if user saved any
    if (workspace.source_files?.length) {
        for (const f of workspace.source_files) {
            if (f.file_path && f.file_content) {
                files.push({ file_path: f.file_path, file_content: f.file_content });
            }
        }
    }
    let githubSummary = null;
    // 2. Query GitHub tools if a GitHub URL is present (with 2.5s safety timeout)
    if (workspace.github_repository_url) {
        try {
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('GitHub summary timeout')), 2500));
            githubSummary = (await Promise.race([
                summarizeGithubRepository(workspace.github_repository_url),
                timeoutPromise,
            ]));
        }
        catch {
            // Continue with best-effort analysis
        }
        // Try to fetch 2-3 key files from GitHub in parallel with a strict 1.5s timeout
        const topTargets = ['package.json', 'README.md', 'server.ts', 'main.py'];
        await Promise.allSettled(topTargets.map(async (targetPath) => {
            if (files.some((f) => f.file_path === targetPath))
                return;
            try {
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500));
                const filePromise = readGithubFile(workspace.github_repository_url, targetPath);
                const ghFile = (await Promise.race([filePromise, timeoutPromise]));
                if (ghFile?.content && ghFile.status === 'ready') {
                    files.push({ file_path: targetPath, file_content: ghFile.content });
                }
            }
            catch {
                // Proceed smoothly
            }
        }));
    }
    // 3. If README excerpt exists in GitHub summary, ensure it is available as a document
    if (githubSummary?.readme_excerpt && !files.some((f) => f.file_path.toLowerCase().includes('readme'))) {
        files.push({
            file_path: 'README.md',
            file_content: `# ${workspace.repository_name}\n\n${githubSummary.project_description || ''}\n\n${githubSummary.readme_excerpt}`,
        });
    }
    // 4. Ingest generated guide if present
    if (workspace.guide) {
        files.push({
            file_path: 'CONTRIBUTOR_GUIDE.md',
            file_content: `# Contributor Guide for ${workspace.repository_name}\n\n${JSON.stringify(workspace.guide, null, 2)}`,
        });
    }
    return {
        repository_name: workspace.repository_name,
        github_repository_url: workspace.github_repository_url,
        github_summary: githubSummary,
        structured_overview: githubSummary?.structured_overview,
        project_overview: githubSummary?.project_overview,
        analysis: githubSummary?.analysis,
        readme: githubSummary?.readme_excerpt || '',
        files,
    };
}
/**
 * Send query to Python RAG service with seamless fallback
 */
export async function queryRag(workspace, query) {
    const context = await compileRepositoryContext(workspace);
    const payload = {
        ...context,
        query,
    };
    try {
        const res = await fetch(`${RAG_SERVICE_URL}/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(1500),
        });
        if (res.ok) {
            return (await res.json());
        }
    }
    catch {
        // Service not reachable via HTTP; invoke Python RAG engine directly
    }
    return executePythonRagDirectly('query', payload);
}
/**
 * Send summarization request to Python RAG service with seamless fallback
 */
export async function summarizeRag(workspace) {
    const context = await compileRepositoryContext(workspace);
    const payload = {
        ...context,
    };
    try {
        const res = await fetch(`${RAG_SERVICE_URL}/summarize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(1500),
        });
        if (res.ok) {
            return (await res.json());
        }
    }
    catch {
        // Service not reachable via HTTP; invoke Python RAG engine directly
    }
    return executePythonRagDirectly('summarize', payload);
}
/**
 * Load external documentation or website URL into LangChain vector store
 */
export async function loadWebsiteUrl(url) {
    const payload = { url };
    try {
        const res = await fetch(`${RAG_SERVICE_URL}/load-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(6000),
        });
        if (res.ok) {
            return await res.json();
        }
    }
    catch {
        // Service not reachable via HTTP; invoke Python RAG engine directly
    }
    return executePythonRagDirectly('load_url', payload);
}
/**
 * Resolve root repository folder containing 'rag_service'
 */
function findRepoRoot() {
    const candidates = [
        process.cwd(),
        path.resolve(process.cwd(), '..'),
        path.resolve(__dirname, '../../..'),
        path.resolve(__dirname, '../../../..'),
    ];
    for (const candidate of candidates) {
        if (fs.existsSync(path.join(candidate, 'rag_service', 'rag_engine.py'))) {
            return candidate;
        }
    }
    return process.cwd();
}
/**
 * Direct Python subprocess execution ensuring 100% reliable intelligence output
 */
function executePythonRagDirectly(action, payload) {
    return new Promise((resolve, reject) => {
        const rootDir = findRepoRoot();
        const enginePath = path.join(rootDir, 'rag_service', 'rag_engine.py');
        const py = spawn('python', [enginePath], {
            cwd: rootDir,
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        let stdout = '';
        let stderr = '';
        py.stdout.on('data', (d) => {
            stdout += d.toString();
        });
        py.stderr.on('data', (d) => {
            stderr += d.toString();
        });
        py.on('close', (code) => {
            if (code === 0 && stdout.trim()) {
                try {
                    resolve(JSON.parse(stdout.trim()));
                }
                catch {
                    reject(new Error(`Failed to parse Python RAG output: ${stdout}`));
                }
            }
            else {
                reject(new Error(`Python RAG execution failed (code ${code}): ${stderr || stdout}`));
            }
        });
        py.stdin.write(JSON.stringify({ action, payload }));
        py.stdin.end();
    });
}
