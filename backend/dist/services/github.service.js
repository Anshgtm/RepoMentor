import { github, githubConfigured } from './integrations.js';
const summaryCache = new Map();
const SUMMARY_CACHE_MS = 10 * 60 * 1000;
const ANALYSIS_VERSION = 'v4';
/**
 * Filter out noise, binaries, compiled code, model weights, and generated lockfiles
 */
const EXCLUDED_PATTERNS = [
    /(^|\/)(__pycache__|\.git|node_modules|\.next|dist|build|out|target|bin|obj|\.turbo|\.cache|\.idea|\.vscode|coverage|vendor)(\/|$)/i,
    /\.(pyc|pyo|pyd|exe|dll|so|dylib|class|jar|zip|tar|gz|7z)$/i,
    /\.(bin|pt|pth|onnx|safetensors|h5|pkl|ckpt|tflite)$/i, // Model weights - not ordinary source code!
    /\.(map|min\.js|min\.css)$/i,
    /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$/i,
];
function isExcludedPath(path) {
    return EXCLUDED_PATTERNS.some((pattern) => pattern.test(path));
}
function githubErrorReason(error) {
    const headers = error?.response?.headers || {};
    const remaining = headers['x-ratelimit-remaining'];
    const reset = headers['x-ratelimit-reset'];
    const retryAfter = headers['retry-after'];
    if (error?.status === 403 || error?.status === 429 || remaining === '0' || /rate limit/i.test(error?.message || '')) {
        const resetText = reset ? ` Try again after ${new Date(Number(reset) * 1000).toLocaleTimeString()}.` : retryAfter ? ` Retry after ${retryAfter} seconds.` : '';
        return `GitHub API rate limit reached.${resetText} Configure GITHUB_TOKEN for authenticated requests.`;
    }
    return githubConfigured ? 'Check that the repository is public or that your token has access.' : 'GitHub integration is not configured on the API.';
}
function cleanMarkdown(value) {
    return value
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/[*_>#]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}
function humanizeName(value) {
    return value.replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function inferDirectoryRole(dir) {
    const d = dir.toLowerCase();
    if (d.includes('controller') || d.includes('route') || d.includes('api') || d.includes('endpoint')) {
        return 'API routes & request controllers';
    }
    if (d.includes('model') || d.includes('schema') || d.includes('entity') || d.includes('migration') || d.includes('prisma')) {
        return 'Database schemas & data models';
    }
    if (d.includes('component') || d.includes('view') || d.includes('page') || d.includes('ui')) {
        return 'User interface components & layouts';
    }
    if (d.includes('service') || d.includes('core') || d.includes('logic')) {
        return 'Core business logic & service handlers';
    }
    if (d.includes('test') || d.includes('spec') || d.includes('__tests__')) {
        return 'Automated tests & verification suites';
    }
    if (d.includes('config') || d.includes('setting') || d.includes('env')) {
        return 'Application configuration & environment setup';
    }
    if (d.includes('hook') || d.includes('util') || d.includes('helper') || d.includes('lib')) {
        return 'Utility functions & reusable helpers';
    }
    if (d.includes('doc') || d.includes('guide')) {
        return 'Documentation & guides';
    }
    return 'Application source code';
}
function readmeDetailsFromText(readme) {
    const paragraphs = readme
        .split(/\n\s*\n/)
        .map(cleanMarkdown)
        .filter((value) => value.length > 35 && !/^\[!\[/.test(value));
    const headings = readme
        .split('\n')
        .filter((line) => /^#{1,4}\s/.test(line))
        .map((line) => cleanMarkdown(line.replace(/^#+\s*/, '')));
    const featureLines = readme
        .split('\n')
        .filter((line) => /^[-*+]\s/.test(line))
        .map((line) => cleanMarkdown(line.replace(/^[-*+]\s+/, '')))
        .filter((line) => line.length > 15 && !line.includes('http'))
        .slice(0, 8);
    const problem = paragraphs.find((value) => /(problem|challenge|why|instead of|solves|eliminates|struggle|headache|friction|simplif|designed to)/i.test(value));
    const audience = paragraphs.find((value) => /(built for|target audience|for developers|for beginners|who is this for|users|teams|students)/i.test(value));
    return {
        intro: paragraphs[0] || '',
        problem: problem || '',
        audience: audience || '',
        featureLines,
        headings,
        paragraphs,
    };
}
async function analyzeRepository(owner, repo, branch, readme, primaryLang) {
    const treeResponse = await github.git.getTree({ owner, repo, tree_sha: branch, recursive: '1' });
    const allBlobs = (treeResponse.data.tree || []).filter((item) => item.type === 'blob' && typeof item.path === 'string');
    // 1. Filter out all ignored noise, compiled binaries, and model weights
    const cleanedBlobs = allBlobs.filter((item) => !isExcludedPath(item.path));
    // 2. Score and prioritize meaningful files (manifests, entrypoints, routes, models, services)
    function priorityScore(path) {
        const p = path.toLowerCase();
        if (/readme(\.md)?$/i.test(p))
            return 100;
        if (/(package\.json|requirements\.txt|pyproject\.toml|go\.mod|Cargo\.toml)$/i.test(p))
            return 95;
        if (/(^|\/)(main|index|server|app)\.(ts|tsx|js|jsx|py|go|rs)$/i.test(p))
            return 90;
        if (/routes?|controllers?|endpoints?|api\//i.test(p))
            return 85;
        if (/models?|schemas?|entities?|prisma/i.test(p))
            return 80;
        if (/services?|core/i.test(p))
            return 75;
        if (/components?|pages?/i.test(p))
            return 70;
        if (/\.(ts|tsx|js|jsx|py|go|rs|java|cpp|c|rb|php)$/i.test(p))
            return 60;
        return 30;
    }
    const sortedBlobs = [...cleanedBlobs].sort((a, b) => priorityScore(b.path) - priorityScore(a.path));
    const relevant = sortedBlobs.slice(0, 75);
    // 3. Fetch source contents for high-priority files
    const files = await Promise.all(relevant.map(async (item) => {
        try {
            const response = await github.git.getBlob({ owner, repo, file_sha: item.sha });
            return {
                path: item.path,
                content: Buffer.from(response.data.content, 'base64').toString('utf8').slice(0, 18000),
            };
        }
        catch {
            return { path: item.path, content: '' };
        }
    }));
    const manifests = files.filter((file) => /(^|\/)(package\.json|requirements\.txt|pyproject\.toml|go\.mod|Cargo\.toml)$/i.test(file.path));
    const entryPoints = files
        .filter((file) => /(^|\/)(main|index|server|app)\.(ts|tsx|js|jsx|py|go|rs)$/i.test(file.path))
        .map((file) => file.path);
    const routeFiles = files.filter((file) => /(route|controller|endpoint|api\/)/i.test(file.path) ||
        /(?:app|router)\.(get|post|put|patch|delete|use)\s*\(/i.test(file.content) ||
        /@(Get|Post|Put|Patch|Delete|RequestMapping)\s*\(/i.test(file.content));
    const modelFiles = files.filter((file) => /(model|schema|migration|entity|prisma)/i.test(file.path));
    // 4. Parse dependencies and categorize frontend / backend / database
    const dependencies = [];
    for (const file of manifests) {
        if (file.path.endsWith('package.json')) {
            try {
                const json = JSON.parse(file.content);
                dependencies.push(...Object.keys({ ...(json.dependencies || {}), ...(json.devDependencies || {}) }));
            }
            catch { }
        }
        else {
            dependencies.push(...file.content
                .split('\n')
                .map((line) => line.trim().split(/[=<>~]/)[0])
                .filter((line) => line && !line.startsWith('#'))
                .slice(0, 30));
        }
    }
    const techItems = [];
    const techNames = new Set();
    function addTech(name, purpose, category) {
        if (!techNames.has(name)) {
            techNames.add(name);
            techItems.push({ name, purpose, category });
        }
    }
    for (const dep of dependencies) {
        const d = dep.toLowerCase();
        if (d.includes('react'))
            addTech('React', 'Powers reactive user interface views in the browser', 'frontend');
        if (d.includes('next'))
            addTech('Next.js', 'Full-stack React framework with server-side routing', 'frontend');
        if (d.includes('vue'))
            addTech('Vue.js', 'Progressive frontend UI library', 'frontend');
        if (d.includes('tailwind'))
            addTech('Tailwind CSS', 'Utility-first stylesheet styling system', 'frontend');
        if (d.includes('vite'))
            addTech('Vite', 'Fast frontend development bundler and asset server', 'frontend');
        if (d.includes('express'))
            addTech('Express.js', 'Lightweight HTTP web server and REST routing engine', 'backend');
        if (d.includes('fastify'))
            addTech('Fastify', 'High-performance Node.js web server framework', 'backend');
        if (d.includes('nestjs'))
            addTech('NestJS', 'Structured enterprise server framework with dependency injection', 'backend');
        if (d.includes('langchain'))
            addTech('LangChain', 'LLM orchestration and vector database retrieval framework', 'backend');
        if (d.includes('mongoose'))
            addTech('Mongoose / MongoDB', 'Object data modeling library for MongoDB databases', 'database_infra');
        if (d.includes('prisma'))
            addTech('Prisma ORM', 'Type-safe database ORM and migration tool', 'database_infra');
        if (d.includes('postgres') || d.includes('pg'))
            addTech('PostgreSQL', 'Relational database persistence', 'database_infra');
        if (d.includes('redis'))
            addTech('Redis', 'In-memory caching and session state store', 'database_infra');
        if (d.includes('zod') || d.includes('pydantic'))
            addTech('Zod / Schema Validation', 'Validates incoming user requests and environment variables', 'backend');
    }
    if (primaryLang) {
        if (/typescript/i.test(primaryLang))
            addTech('TypeScript', 'Catches syntax and type bugs before code runs', 'tooling');
        else if (/javascript/i.test(primaryLang))
            addTech('JavaScript', 'Core programming language powering the application', 'tooling');
        else if (/python/i.test(primaryLang))
            addTech('Python', 'Powers server logic, artificial intelligence, and scripts', 'backend');
        else if (/go/i.test(primaryLang))
            addTech('Go', 'Fast compiled systems language for backend microservices', 'backend');
        else if (/rust/i.test(primaryLang))
            addTech('Rust', 'Memory-safe systems language for high-performance modules', 'backend');
    }
    // 5. Extract endpoints and models
    const routeSignals = routeFiles
        .flatMap((file) => [
        ...file.content.matchAll(/(?:app|router)\.(get|post|put|patch|delete|use)\s*\(\s*[`'"]([^`'"]+)/gi),
    ].map((match) => `${match[1].toUpperCase()} ${match[2]}`))
        .concat(routeFiles.flatMap((file) => [
        ...file.content.matchAll(/@(Get|Post|Put|Patch|Delete)\s*\(\s*[`'"]?([^`'")\s]*)/gi),
    ].map((match) => `${match[1].toUpperCase()} ${match[2] || '/'}`)))
        .slice(0, 24);
    const modelSignals = modelFiles.map((file) => file.path).slice(0, 12);
    // 6. Trace important execution paths
    const importantPaths = routeFiles
        .flatMap((file) => {
        const routes = [...file.content.matchAll(/(?:app|router)\.(get|post|put|patch|delete|use)\s*\(\s*[`'"]([^`'"]+)/gi)];
        const imports = [...file.content.matchAll(/from\s+['"]([^'"]+)['"]/g)]
            .map((match) => match[1])
            .filter((value) => !value.startsWith('@'));
        return routes.slice(0, 5).map((route) => ({
            label: `${route[1].toUpperCase()} ${route[2]}`,
            steps: [file.path, ...imports.slice(0, 2), ...modelFiles.slice(0, 1).map((m) => m.path)],
            evidence: [file.path, ...modelFiles.slice(0, 1).map((m) => m.path)],
        }));
    })
        .slice(0, 12);
    const fallbackPaths = importantPaths.length
        ? importantPaths
        : entryPoints.slice(0, 4).map((entry) => ({
            label: `Entry path: ${entry}`,
            steps: [entry],
            evidence: [entry],
        }));
    // 7. Group files by directory for clean, structured display (Part 3)
    const dirMap = new Map();
    for (const f of cleanedBlobs) {
        const parts = f.path.split('/');
        const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : 'root';
        if (!dirMap.has(dir))
            dirMap.set(dir, []);
        dirMap.get(dir).push(f.path);
    }
    const directory_groups = Array.from(dirMap.entries())
        .map(([directory, filePaths]) => ({
        directory: directory === 'root' ? 'Root Directory' : directory,
        count: filePaths.length,
        role: inferDirectoryRole(directory),
        sample_files: filePaths.slice(0, 4),
    }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12);
    const architectureNotes = [
        entryPoints.length ? `Application entry points: ${entryPoints.join(', ')}.` : '',
        routeFiles.length ? `Identified ${routeFiles.length} API route and controller files.` : '',
        modelFiles.length ? `Data structures defined across ${modelFiles.length} schema files.` : '',
        manifests.length ? `Dependencies declared in ${manifests.map((file) => file.path).join(', ')}.` : '',
    ].filter(Boolean);
    return {
        files_analyzed: files.map((file) => file.path),
        dependency_manifests: manifests.map((file) => file.path),
        entry_points: entryPoints,
        routes_and_endpoints: routeSignals,
        data_models: modelSignals,
        architecture_notes: architectureNotes,
        technologies: Array.from(techNames),
        tech_items: techItems,
        important_paths: fallbackPaths,
        directory_groups,
    };
}
/**
 * Generate Part 1: Structured 5-Part Overview in plain English
 */
function makeStructuredOverview(name, repository, readme, analysis) {
    const projectName = humanizeName(name);
    const readmeData = readmeDetailsFromText(readme);
    const hasReadmeIntro = Boolean(readmeData.intro && readmeData.intro.length > 30);
    const hasReadmeProblem = Boolean(readmeData.problem && readmeData.problem.length > 30);
    const hasReadmeAudience = Boolean(readmeData.audience && readmeData.audience.length > 25);
    // 1. What does this project do?
    const whatContent = hasReadmeIntro
        ? readmeData.intro
        : repository.description
            ? repository.description
            : `${projectName} is a software repository built primarily with ${repository.language || 'modern web technologies'}. It provides ${analysis.entry_points.length ? `entrypoints starting in ${analysis.entry_points[0]}` : 'application source files'} and ${analysis.routes_and_endpoints.length ? `${analysis.routes_and_endpoints.length} active service operations` : 'modular utilities'}.`;
    // 2. What problem does it solve?
    const problemContent = hasReadmeProblem
        ? readmeData.problem
        : analysis.routes_and_endpoints.length > 0
            ? `Eliminates manual complexity by automating key operations (${analysis.routes_and_endpoints.slice(0, 3).join(', ')}) through a structured backend.`
            : `Provides an organized codebase foundation in ${repository.language || 'the declared technologies'}, reducing manual setup and fragmented code organization.`;
    // 3. Who is it built for?
    const whoContent = hasReadmeAudience
        ? readmeData.audience
        : `Developers, students, and teams working with ${repository.language || 'software engineering'} who need a tested, structured codebase to build or integrate upon.`;
    // 4. How does it work?
    const howSteps = [];
    if (analysis.entry_points.length > 0) {
        howSteps.push(`1. Execution begins in \`${analysis.entry_points[0]}\`, which initializes configurations and server listeners.`);
    }
    else {
        howSteps.push(`1. Application initializes through root module files and configuration declarations.`);
    }
    if (analysis.routes_and_endpoints.length > 0) {
        howSteps.push(`2. Incoming requests are matched by routes (${analysis.routes_and_endpoints.slice(0, 2).join(', ')}), validating payloads before processing.`);
    }
    else {
        howSteps.push(`2. Input requests or function calls are verified and routed to dedicated service functions.`);
    }
    if (analysis.data_models.length > 0) {
        howSteps.push(`3. Data models (${analysis.data_models.slice(0, 2).map((m) => `\`${m}\``).join(', ')}) enforce structure and persist records.`);
    }
    else {
        howSteps.push(`3. Business logic processes the input and formats the computed state or results.`);
    }
    howSteps.push(`4. The application returns the response or renders the updated view to the user.`);
    // 5. Technologies used (Frontend, Backend, Database/Infra)
    const frontendTech = analysis.tech_items.filter((t) => t.category === 'frontend');
    const backendTech = analysis.tech_items.filter((t) => t.category === 'backend' || t.category === 'tooling');
    const dbTech = analysis.tech_items.filter((t) => t.category === 'database_infra');
    if (backendTech.length === 0 && repository.language) {
        backendTech.push({
            name: repository.language,
            purpose: 'Primary programming language implementation',
            category: 'backend',
        });
    }
    return {
        what_it_does: {
            title: 'What does this project do?',
            content: whatContent,
            is_verified: hasReadmeIntro,
            evidence: hasReadmeIntro ? 'Verified directly from the project README' : 'Inferred from repository entrypoints and code structure',
        },
        problem_it_solves: {
            title: 'What problem does it solve?',
            content: problemContent,
            is_verified: hasReadmeProblem,
            evidence: hasReadmeProblem ? 'Verified directly from README documentation' : 'Inferred from route controllers and data schemas',
        },
        who_it_is_for: {
            title: 'Who is it built for?',
            content: whoContent,
            is_verified: hasReadmeAudience,
            evidence: hasReadmeAudience ? 'Verified from documentation audience notes' : 'Inferred from repository domain and tech stack',
        },
        how_it_works: {
            title: 'How does it work?',
            content: `The system coordinates user requests, service logic, and database persistence in a structured flow:`,
            is_verified: analysis.entry_points.length > 0,
            steps: howSteps,
        },
        technologies: {
            frontend: frontendTech,
            backend: backendTech,
            database_or_infra: dbTech,
        },
    };
}
/**
 * Generate Part 2: Upgraded Information Cards
 */
function makeProjectOverview(name, repository, readme, analysis, structured) {
    const projectName = humanizeName(name);
    const readmeData = readmeDetailsFromText(readme);
    // Explain actual feature functionality instead of raw endpoint listing
    const featureBullets = readmeData.featureLines.length > 0
        ? readmeData.featureLines
        : analysis.routes_and_endpoints.length > 0
            ? analysis.routes_and_endpoints.slice(0, 6).map((route) => {
                const [method, path] = route.split(' ');
                return `${method} ${path}: Handles requests and dispatches application actions.`;
            })
            : [
                'Modular architecture dividing routing, business logic, and schemas.',
                'Structured configuration for predictable local execution.',
                'Validated data handling ensuring system reliability.',
            ];
    const stackBullets = [];
    if (structured.technologies.frontend.length > 0) {
        stackBullets.push(`Frontend: ${structured.technologies.frontend.map((t) => t.name).join(', ')}`);
    }
    if (structured.technologies.backend.length > 0) {
        stackBullets.push(`Backend: ${structured.technologies.backend.map((t) => t.name).join(', ')}`);
    }
    if (structured.technologies.database_or_infra.length > 0) {
        stackBullets.push(`Database & Infra: ${structured.technologies.database_or_infra.map((t) => t.name).join(', ')}`);
    }
    if (stackBullets.length === 0) {
        stackBullets.push(`Primary Language: ${repository.language || 'Source code files'}`);
    }
    // Component relationships for Architecture
    const architectureBullets = [
        analysis.entry_points.length
            ? `Entry Points (${analysis.entry_points.join(', ')}): Receives execution and initializes global configuration.`
            : 'Entry point: Initializes application services.',
        analysis.routes_and_endpoints.length
            ? `Routing Layer (${analysis.routes_and_endpoints.length} endpoints): Validates incoming user inputs and directs them to controllers.`
            : 'Routing: Dispatches user intentions to service logic.',
        analysis.data_models.length
            ? `Data Models (${analysis.data_models.slice(0, 4).join(', ')}): Enforces database schemas and structure.`
            : 'State / Models: Manages in-memory or database records.',
        'Response Flow: Service results are packaged and returned cleanly to the caller.',
    ];
    // Grouped project structure (Part 3 requirement)
    const structureBullets = (analysis.directory_groups || [])
        .slice(0, 6)
        .map((g) => `${g.directory}: ${g.role} (${g.count} files)`);
    return {
        what_the_project_is: {
            title: 'What the project is',
            content: structured.what_it_does.content,
        },
        problem_it_solves: {
            title: 'Problem it solves',
            content: structured.problem_it_solves.content,
            bullets: [
                `Grounded in: ${structured.problem_it_solves.evidence}`,
                'Automates repetitive workflows to reduce human error.',
                'Organizes software logic into clearly separated layers.',
            ],
        },
        how_it_works: {
            title: 'How it works',
            content: 'Execution journey traced through verified source code:',
            bullets: structured.how_it_works.steps,
        },
        key_features: {
            title: 'Key features',
            content: 'Core capabilities supported by the repository implementation:',
            bullets: featureBullets,
        },
        technology_stack: {
            title: 'Technology stack',
            content: 'Identified frontend, backend, and infrastructure libraries:',
            bullets: stackBullets,
        },
        architecture: {
            title: 'Architecture & Relationships',
            content: 'Component connections showing how data travels through the codebase:',
            bullets: architectureBullets,
        },
        target_users: {
            title: 'Target users',
            content: structured.who_it_is_for.content,
            bullets: [
                `Identified audience: ${structured.who_it_is_for.evidence}`,
                'Contributors seeking to understand or extend the repository.',
                'Engineers evaluating the software architecture.',
            ],
        },
        project_structure: {
            title: 'Project structure (by directory)',
            content: 'Directories organized by their actual responsibilities in the project:',
            bullets: structureBullets.length > 0 ? structureBullets : ['Root directory: Contains configuration and source entry files.'],
        },
        setup_and_execution: {
            title: 'Setup and execution',
            content: analysis.dependency_manifests.length
                ? `Configuration files found: ${analysis.dependency_manifests.join(', ')}. Install dependencies and follow local run instructions.`
                : 'Install dependencies corresponding to the primary programming language and launch the development command.',
        },
        limitations_and_missing_information: {
            title: 'Verified vs Inferred Information',
            content: 'RepoMentor clearly distinguishes verified source facts from inferred analysis:',
            bullets: [
                structured.what_it_does.is_verified ? 'Project purpose: Verified from official documentation' : 'Project purpose: Inferred from entrypoints and source layout',
                structured.problem_it_solves.is_verified ? 'Problem statement: Verified from README' : 'Problem statement: Inferred from controller endpoints',
                'Model weights and compiled binaries are excluded from source analysis.',
            ],
        },
    };
}
function parseRepositoryUrl(value) {
    try {
        const url = new URL(value);
        if (url.hostname.toLowerCase() !== 'github.com')
            return null;
        const [owner, repository] = url.pathname.split('/').filter(Boolean);
        if (!owner || !repository)
            return null;
        return { owner, repository: repository.replace(/\.git$/, '') };
    }
    catch {
        return null;
    }
}
export async function summarizeGithubRepository(repositoryUrl) {
    if (!repositoryUrl) {
        return {
            available: false,
            configured: githubConfigured,
            plain_language: 'No GitHub repository was supplied.',
            project_description: 'Add a GitHub repository URL so RepoMentor can explain what this project does.',
            description_source: 'unavailable',
        };
    }
    const parsed = parseRepositoryUrl(repositoryUrl);
    if (!parsed) {
        return {
            available: false,
            configured: githubConfigured,
            plain_language: 'The supplied URL is not a valid GitHub repository URL.',
            project_description: 'The project description cannot be inferred until a valid GitHub repository URL is supplied.',
            description_source: 'unavailable',
            reason: 'Use a URL such as https://github.com/owner/repository.',
        };
    }
    const cacheKey = `${ANALYSIS_VERSION}:${parsed.owner}/${parsed.repository}`;
    const cached = summaryCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now())
        return cached.value;
    try {
        const [{ data: repository }, readmeResponse] = await Promise.all([
            github.repos.get({ owner: parsed.owner, repo: parsed.repository }),
            github.repos.getReadme({ owner: parsed.owner, repo: parsed.repository }).catch(() => null),
        ]);
        const readme = readmeResponse?.data && 'content' in readmeResponse.data
            ? Buffer.from(readmeResponse.data.content, 'base64').toString('utf8')
            : '';
        const analysis = await analyzeRepository(parsed.owner, parsed.repository, repository.default_branch, readme, repository.language);
        const structuredOverview = makeStructuredOverview(parsed.repository, repository, readme, analysis);
        const projectOverview = makeProjectOverview(parsed.repository, repository, readme, analysis, structuredOverview);
        const result = {
            available: true,
            configured: githubConfigured,
            owner: parsed.owner,
            name: parsed.repository,
            html_url: repository.html_url,
            description: repository.description,
            language: repository.language,
            stars: repository.stargazers_count,
            forks: repository.forks_count,
            open_issues: repository.open_issues_count,
            default_branch: repository.default_branch,
            project_description: structuredOverview.what_it_does.content,
            description_source: structuredOverview.what_it_does.is_verified ? 'readme' : 'inferred',
            plain_language: structuredOverview.what_it_does.content,
            readme_excerpt: readme ? cleanMarkdown(readme).slice(0, 600) : undefined,
            analysis,
            structured_overview: structuredOverview,
            project_overview: projectOverview,
        };
        summaryCache.set(cacheKey, { expiresAt: Date.now() + SUMMARY_CACHE_MS, value: result });
        return result;
    }
    catch (error) {
        return {
            available: false,
            configured: githubConfigured,
            owner: parsed.owner,
            name: parsed.repository,
            plain_language: `GitHub details currently unavailable for ${parsed.owner}/${parsed.repository}.`,
            project_description: 'Enter a valid repository to begin analysis.',
            description_source: 'inferred',
            reason: githubErrorReason(error),
        };
    }
}
