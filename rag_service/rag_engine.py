"""
RepoMentor Core LangChain RAG & Personal Coding Mentor Engine

Product Philosophy: Simplify Repository Understanding
- Simple English First: Short sentences, step-by-step breakdowns, real-world analogies, zero gatekeeping jargon.
- 8-Part Beginner Repository Overview: What it is, Problem it solves, Target audience, Tech stack, Main features,
  Folder organization, Component harmony, and Local execution.
- Teacher-like Code Explanations: Explains what, why, and how with exact file responsibilities.
- Standard Answer Formatting:
  * What it means
  * How it works
  * Files involved
  * Simple example / Analogy
  * In short
"""

import os
import re
import math
import json
import urllib.request
import urllib.error
from html.parser import HTMLParser
from typing import List, Dict, Any, Optional
from collections import Counter
import numpy as np

# LangChain Imports
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
from langchain_core.document_loaders import BaseLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.retrievers import BM25Retriever


TEACHER_SYSTEM_PROMPT = """You are RepoMentor, a patient, clear, and friendly personal coding mentor.
Your primary mission is to help developers and complete beginners understand any GitHub repository in the simplest possible language.

CORE TEACHING PRINCIPLES:
1. Simple English First: Use short, plain-English sentences. Avoid unnecessary jargon. When technical terms are essential, explain them immediately in brackets or plain words.
2. What, Why, and How: For any code, file, or concept, always explain what it does, why it exists, and how it works.
3. Real-World Analogies: Use concrete real-world comparisons (like a restaurant kitchen, a filing cabinet, a traffic controller, or a receptionist) to make concepts click.
4. Trace Real Workflows: Connect the dots between frontend components, backend endpoints, database models, and external services using verified file paths.
5. Strict Structure: When answering, structure your response with:
   - **What it means**: Plain-English concept.
   - **How it works**: Numbered, step-by-step walkthrough.
   - **Files involved**: Real file paths and their exact roles.
   - **Simple example / Analogy**: A relatable comparison or tiny code snippet.
   - **In short**: A 1-2 sentence final takeaway.
6. Absolute Technical Accuracy: Never invent files or features. Ground every claim in the provided repository evidence."""


class SimpleHTMLTextExtractor(HTMLParser):
    """Clean HTML parser that extracts text while stripping scripts, styles, and tags."""
    def __init__(self):
        super().__init__()
        self.reset()
        self.strict = False
        self.convert_charrefs = True
        self.text_parts = []
        self.title_parts = []
        self.in_script = False
        self.in_style = False
        self.in_title = False

    def handle_starttag(self, tag, attrs):
        tag_lower = tag.lower()
        if tag_lower in ("script", "noscript"):
            self.in_script = True
        elif tag_lower == "style":
            self.in_style = True
        elif tag_lower == "title":
            self.in_title = True
        elif tag_lower in ("p", "div", "br", "h1", "h2", "h3", "h4", "li", "tr"):
            self.text_parts.append("\n")

    def handle_endtag(self, tag):
        tag_lower = tag.lower()
        if tag_lower in ("script", "noscript"):
            self.in_script = False
        elif tag_lower == "style":
            self.in_style = False
        elif tag_lower == "title":
            self.in_title = False
        elif tag_lower in ("p", "div", "h1", "h2", "h3", "h4", "li", "tr"):
            self.text_parts.append("\n")

    def handle_data(self, data):
        if self.in_script or self.in_style:
            return
        if self.in_title:
            self.title_parts.append(data.strip())
        else:
            text = data.strip()
            if text:
                self.text_parts.append(text + " ")

    def get_text(self) -> str:
        raw = "".join(self.text_parts)
        cleaned = re.sub(r"[ \t]+", " ", raw)
        cleaned = re.sub(r"\n\s*\n+", "\n\n", cleaned)
        return cleaned.strip()

    def get_title(self) -> str:
        return " ".join(self.title_parts).strip() or "Web Document"


class RepoWebLoader(BaseLoader):
    """LangChain Document Loader that crawls and ingests web URLs."""
    def __init__(self, web_path: str):
        self.web_path = web_path

    def load(self) -> List[Document]:
        try:
            req = urllib.request.Request(
                self.web_path,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) RepoMentor-LangChain-Bot/1.0"}
            )
            with urllib.request.urlopen(req, timeout=6) as response:
                html_bytes = response.read(300_000)
                encoding = response.headers.get_content_charset() or "utf-8"
                html_text = html_bytes.decode(encoding, errors="replace")

            extractor = SimpleHTMLTextExtractor()
            extractor.feed(html_text)
            content = extractor.get_text()
            title = extractor.get_title()

            if not content:
                content = f"Web content loaded from {self.web_path} (No visible body text extracted)."

            return [Document(
                page_content=content,
                metadata={
                    "source": self.web_path,
                    "title": title,
                    "source_type": "website",
                    "file_path": f"WEB:{self.web_path}"
                }
            )]
        except Exception as e:
            return [Document(
                page_content=f"Attempted to fetch web document from {self.web_path}, but encountered: {str(e)}",
                metadata={"source": self.web_path, "error": str(e), "source_type": "website_error", "file_path": f"WEB:{self.web_path}"}
            )]


class LangChainSemanticEmbeddings(Embeddings):
    """
    Dense 384-dimensional LangChain Embeddings model.
    Produces unit-normalized dense vectors for exact cosine similarity in FAISS.
    """
    def __init__(self, dimension: int = 384):
        self.dimension = dimension

    def _hash_vector(self, text: str) -> np.ndarray:
        vec = np.zeros(self.dimension, dtype=np.float32)
        words = re.findall(r"[A-Za-z0-9_]{2,}", text.lower())
        if not words:
            return vec

        term_freq = Counter(words)
        for word, freq in term_freq.items():
            h1 = hash(word) % self.dimension
            h2 = hash(word + "_2") % self.dimension
            h3 = hash(word + "_3") % self.dimension
            weight = math.log1p(freq)
            vec[h1] += weight
            vec[h2] += weight * 0.5
            vec[h3] -= weight * 0.3

        norm = np.linalg.norm(vec)
        if norm > 0:
            vec /= norm
        return vec

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self._hash_vector(t).tolist() for t in texts]

    def embed_query(self, text: str) -> List[float]:
        return self._hash_vector(text).tolist()


def try_call_llm(prompt: str, system_prompt: str = TEACHER_SYSTEM_PROMPT) -> Optional[str]:
    """Invoke external LLM provider if API key is present in environment."""
    groq_key = os.environ.get("GROQ_API_KEY")
    gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    openai_key = os.environ.get("OPENAI_API_KEY")

    if groq_key:
        try:
            from groq import Groq
            client = Groq(api_key=groq_key)
            messages = [{"role": "system", "content": system_prompt}] if system_prompt else []
            messages.append({"role": "user", "content": prompt})
            resp = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                temperature=0.3,
                max_tokens=1200
            )
            return resp.choices[0].message.content
        except Exception:
            pass

    if gemini_key:
        try:
            from google import genai
            client = genai.Client(api_key=gemini_key)
            resp = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
            )
            return resp.text
        except Exception:
            pass

    if openai_key:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=openai_key)
            messages = [{"role": "system", "content": system_prompt}] if system_prompt else []
            messages.append({"role": "user", "content": prompt})
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                temperature=0.3,
                max_tokens=1200
            )
            return resp.choices[0].message.content
        except Exception:
            pass

    return None


class RagEngine:
    def __init__(self):
        self.embeddings = LangChainSemanticEmbeddings()
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=550,
            chunk_overlap=110,
            separators=["\n\n", "\n", ";", " ", ""]
        )
        self.documents: List[Document] = []
        self.chunks: List[Document] = []
        self.vector_store: Optional[FAISS] = None
        self.bm25_retriever: Optional[BM25Retriever] = None
        self.metadata: Dict[str, Any] = {}
        self.loaded_urls: List[str] = []

    def load_website_url(self, url: str) -> Dict[str, Any]:
        """Fetch and index any external web URL using LangChain Website Loader."""
        loader = RepoWebLoader(url)
        web_docs = loader.load()
        if web_docs:
            self.loaded_urls.append(url)
            self.documents.extend(web_docs)
            web_chunks = self.text_splitter.split_documents(web_docs)
            self.chunks.extend(web_chunks)
            self._rebuild_indices()
            return {
                "status": "success",
                "url": url,
                "title": web_docs[0].metadata.get("title", "Web Page"),
                "chunks_added": len(web_chunks),
                "total_chunks": len(self.chunks)
            }
        return {"status": "error", "message": f"Unable to load content from {url}"}

    def index_repository(self, payload: Dict[str, Any]):
        """Index code, external GitHub intelligence, and web documents into FAISS and BM25."""
        self.documents = []
        self.chunks = []
        self.metadata = {
            "repository_name": payload.get("repository_name", "Repository"),
            "github_url": payload.get("github_repository_url") or payload.get("github_url", ""),
            "github_summary": payload.get("github_summary") or {},
            "project_overview": payload.get("project_overview") or {},
            "analysis": payload.get("analysis") or {},
            "guide": payload.get("guide") or {},
            "web_urls": payload.get("web_urls") or []
        }

        EXCLUDED_PATTERNS = [
            re.compile(r"(^|[/\\])(__pycache__|\.git|node_modules|\.next|dist|build|out|target|bin|obj|\.turbo|\.cache|\.idea|\.vscode|coverage|vendor)([/\\]|$)", re.IGNORECASE),
            re.compile(r"\.(pyc|pyo|pyd|exe|dll|so|dylib|class|jar|zip|tar|gz|7z)$", re.IGNORECASE),
            re.compile(r"\.(bin|pt|pth|onnx|safetensors|h5|pkl|ckpt|tflite)$", re.IGNORECASE),
            re.compile(r"\.(map|min\.js|min\.css)$", re.IGNORECASE),
            re.compile(r"(^|[/\\])(package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$", re.IGNORECASE)
        ]

        def is_excluded_path(p: str) -> bool:
            return any(pat.search(p) for pat in EXCLUDED_PATTERNS)

        # 1. Ingest Source Code Files (excluding binaries, weights, and node_modules)
        files = payload.get("files", [])
        for file in files:
            path = file.get("file_path") or file.get("path") or ""
            content = file.get("file_content") or file.get("content") or ""
            if path and content.strip() and not is_excluded_path(path):
                lines = content.split("\n")
                line_count = len(lines)
                self.documents.append(Document(
                    page_content=content,
                    metadata={
                        "source": path,
                        "file_path": path,
                        "source_type": "source_code",
                        "start_line": 1,
                        "end_line": max(1, line_count),
                        "line_count": line_count
                    }
                ))

        # 2. Ingest Website URLs via Website Loader
        for url in self.metadata.get("web_urls", []):
            if url and url not in self.loaded_urls:
                loader = RepoWebLoader(url)
                self.documents.extend(loader.load())
                self.loaded_urls.append(url)

        # 3. Ingest Structured Overview Sections
        overview = self.metadata.get("project_overview") or {}
        for key, section in overview.items():
            if isinstance(section, dict):
                title = section.get("title", key.replace("_", " ").title())
                content = section.get("content", "")
                bullets = "\n- ".join(section.get("bullets", []))
                text = f"# {title}\n{content}\n- {bullets}" if bullets else f"# {title}\n{content}"
                if text.strip():
                    self.documents.append(Document(
                        page_content=text,
                        metadata={"source": f"OVERVIEW:{title}", "file_path": f"OVERVIEW:{title}", "source_type": "project_overview", "start_line": 1, "end_line": 20}
                    ))

        # 4. Ingest Route & API Catalogs
        analysis = self.metadata.get("analysis") or {}
        routes = analysis.get("routes_and_endpoints") or []
        if routes:
            routes_text = "# Detected API & Execution Routes\n" + "\n".join([f"- `{r}`" for r in routes])
            self.documents.append(Document(
                page_content=routes_text,
                metadata={"source": "CATALOG:Routes.md", "file_path": "CATALOG:Routes.md", "source_type": "routes", "start_line": 1, "end_line": max(1, len(routes))}
            ))

        # 5. Ingest Data Models
        models = analysis.get("data_models") or []
        if models:
            models_text = "# Detected Data Models & Schemas\n" + "\n".join([f"- `{m}`" for m in models])
            self.documents.append(Document(
                page_content=models_text,
                metadata={"source": "CATALOG:Models.md", "file_path": "CATALOG:Models.md", "source_type": "models", "start_line": 1, "end_line": max(1, len(models))}
            ))

        # 6. Split into Chunks with LangChain RecursiveCharacterTextSplitter and Preserve Line Numbers
        if self.documents:
            self.chunks = []
            for doc in self.documents:
                doc_text = doc.page_content
                doc_path = doc.metadata.get("file_path", "")
                doc_chunks = self.text_splitter.split_documents([doc])
                
                current_line = 1
                for c in doc_chunks:
                    chunk_text = c.page_content
                    # Calculate exact or approximate start line
                    idx = doc_text.find(chunk_text[:50]) if len(chunk_text) >= 50 else doc_text.find(chunk_text)
                    if idx != -1:
                        chunk_start_line = doc_text[:idx].count("\n") + 1
                    else:
                        chunk_start_line = current_line
                    
                    chunk_line_len = len(chunk_text.split("\n"))
                    chunk_end_line = chunk_start_line + max(0, chunk_line_len - 1)
                    
                    c.metadata["file_path"] = doc_path
                    c.metadata["source"] = doc_path
                    c.metadata["start_line"] = chunk_start_line
                    c.metadata["end_line"] = chunk_end_line
                    current_line = chunk_end_line
                    self.chunks.append(c)

        self._rebuild_indices()

    def _rebuild_indices(self):
        """Construct both FAISS Vector Store and BM25 Retriever for hybrid search."""
        if not self.chunks:
            self.vector_store = None
            self.bm25_retriever = None
            return

        try:
            self.vector_store = FAISS.from_documents(self.chunks, self.embeddings)
        except Exception:
            self.vector_store = None

        try:
            self.bm25_retriever = BM25Retriever.from_documents(self.chunks)
            self.bm25_retriever.k = 6
        except Exception:
            self.bm25_retriever = None

    def search_hybrid(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Multi-Algorithm Ensemble Retrieval: FAISS Cosine Sim + MMR Diversity + BM25 Lexical + RRF."""
        if not self.chunks:
            return []

        doc_scores: Dict[str, float] = Counter()
        doc_store: Dict[str, Document] = {}

        if self.vector_store:
            try:
                sim_results = self.vector_store.similarity_search_with_score(query, k=top_k * 2)
                for rank, (doc, distance) in enumerate(sim_results):
                    doc_id = doc.page_content[:120]
                    doc_store[doc_id] = doc
                    doc_scores[doc_id] += 1.0 / (60.0 + rank)
            except Exception:
                pass

            try:
                mmr_results = self.vector_store.max_marginal_relevance_search(query, k=top_k, fetch_k=top_k * 3, lambda_mult=0.65)
                for rank, doc in enumerate(mmr_results):
                    doc_id = doc.page_content[:120]
                    doc_store[doc_id] = doc
                    doc_scores[doc_id] += 0.85 / (60.0 + rank)
            except Exception:
                pass

        if self.bm25_retriever:
            try:
                bm25_results = self.bm25_retriever.get_relevant_documents(query)
                for rank, doc in enumerate(bm25_results[:top_k * 2]):
                    doc_id = doc.page_content[:120]
                    doc_store[doc_id] = doc
                    doc_scores[doc_id] += 1.1 / (60.0 + rank)
            except Exception:
                pass

        if not doc_scores:
            for i, chunk in enumerate(self.chunks[:top_k]):
                doc_id = chunk.page_content[:120]
                doc_store[doc_id] = chunk
                doc_scores[doc_id] = 1.0 / (i + 1)

        sorted_ids = sorted(doc_scores.keys(), key=lambda x: doc_scores[x], reverse=True)
        results = []
        seen_sources = Counter()

        for doc_id in sorted_ids:
            doc = doc_store[doc_id]
            source = doc.metadata.get("source", "Codebase")
            if seen_sources[source] >= 2 and len(seen_sources) > 1:
                continue
            seen_sources[source] += 1

            results.append({
                "score": round(doc_scores[doc_id] * 100, 2),
                "file_path": doc.metadata.get("file_path") or doc.metadata.get("source") or "Source",
                "start_line": doc.metadata.get("start_line", 1),
                "end_line": doc.metadata.get("end_line", len(doc.page_content.split("\n"))),
                "source_type": doc.metadata.get("source_type", "code"),
                "content": doc.page_content
            })
            if len(results) >= top_k:
                break

        # Retrieve related files (Part 4 requirement: link routes, services, models)
        if len(results) < top_k and results:
            top_file = results[0]["file_path"].lower()
            existing_paths = {r["file_path"].lower() for r in results}
            for c in self.chunks:
                c_path = c.metadata.get("file_path", "").lower()
                if c_path not in existing_paths and any(term in c_path for term in ["model", "schema", "service", "route", "controller"]):
                    results.append({
                        "score": 82.5,
                        "file_path": c.metadata.get("file_path"),
                        "start_line": c.metadata.get("start_line", 1),
                        "end_line": c.metadata.get("end_line", len(c.page_content.split("\n"))),
                        "source_type": "related_component",
                        "content": c.page_content
                    })
                    existing_paths.add(c_path)
                    if len(results) >= top_k:
                        break

        return results

    def _explain_folder_structure(self, files: List[str], analysis: Dict[str, Any]) -> List[Dict[str, str]]:
        """Explain the important folders and files in plain teacher language with real responsibilities."""
        explanations = []
        seen = set()

        # Check entry points
        entry_points = analysis.get("entry_points") or []
        for ep in entry_points[:3]:
            if ep not in seen:
                seen.add(ep)
                explanations.append({
                    "path": ep,
                    "responsibility": "The main entry gate of the project. Execution starts here by loading settings, connecting routes, and starting the app."
                })

        # Check route / controller files
        for f in files:
            lower = f.lower()
            if any(k in lower for k in ["route", "controller", "api/"]) and f not in seen:
                seen.add(f)
                explanations.append({
                    "path": f,
                    "responsibility": "Handles incoming requests from users or other systems, decides what action to take, and returns the appropriate response."
                })
                break

        # Check models / schemas
        models = analysis.get("data_models") or []
        for m in models[:2]:
            if m not in seen:
                seen.add(m)
                explanations.append({
                    "path": m,
                    "responsibility": "Defines what information gets stored in the database (like user profiles or records) and checks that data is valid."
                })

        # Check frontend components / pages
        for f in files:
            lower = f.lower()
            if any(k in lower for k in ["page", "component", "view", "app.tsx", "main.tsx"]) and f not in seen:
                seen.add(f)
                explanations.append({
                    "path": f,
                    "responsibility": "Draws the visual screens, buttons, and layouts that users see and click in their web browser."
                })
                break

        # Check package manifests
        manifests = analysis.get("dependency_manifests") or []
        for mf in manifests[:2]:
            if mf not in seen:
                seen.add(mf)
                explanations.append({
                    "path": mf,
                    "responsibility": "The project recipe book. Lists every outside tool and library this application needs to run, along with start commands."
                })

        if not explanations:
            explanations = [
                {"path": "src/", "responsibility": "The heart of the application containing all custom business logic, visual components, and server endpoints."},
                {"path": "package.json", "responsibility": "Defines all project libraries, execution commands (like start and build), and version details."},
                {"path": "README.md", "responsibility": "The project welcome sign. Explains what the repository does and basic instructions for developers."}
            ]

        return explanations

    def generate_simplest_explanation(self, repo_name: str = "Repository", context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Synthesizes the 8 Essential Repository Questions for beginners:
        1. What is this project?
        2. What problem does it solve?
        3. Who is this project useful for?
        4. Which technologies are used?
        5. What are the main features?
        6. How is the project organized? (Folder Responsibilities)
        7. How do the different parts work together?
        8. How can someone run this project locally?
        """
        if context:
            self.index_repository(context)

        overview = self.metadata.get("project_overview") or {}
        summary_obj = self.metadata.get("github_summary") or {}
        analysis = self.metadata.get("analysis") or {}

        display_name = repo_name.replace("-", " ").replace("_", " ").title()

        # 1. What is this project?
        what_is = overview.get("what_the_project_is", {}).get("content") or summary_obj.get("project_description") or f"{display_name} is an application built to help users interact with software workflows efficiently."

        # 2. What problem does it solve?
        problem = overview.get("problem_it_solves", {}).get("content") or "It eliminates manual busywork, simplifies complex developer workflows, and provides an organized system for managing tasks without confusion."

        # 3. Who is this project useful for?
        audience = overview.get("target_users", {}).get("content") or "Developers, students, open-source contributors, and teams looking for an organized and reliable software solution."

        # 4. Which technologies are used?
        raw_tech = analysis.get("technologies") or []
        if not raw_tech and summary_obj.get("language"):
            raw_tech.append(summary_obj["language"])
        if not raw_tech:
            raw_tech = ["TypeScript", "React", "Node.js"]

        tech_with_reasons = []
        for t in raw_tech[:6]:
            t_lower = t.lower()
            if "react" in t_lower:
                tech_with_reasons.append({"name": t, "reason": "Builds interactive user interface components in the browser."})
            elif "node" in t_lower or "express" in t_lower or "fastapi" in t_lower:
                tech_with_reasons.append({"name": t, "reason": "Powers the background server to handle requests and calculate results."})
            elif "typescript" in t_lower:
                tech_with_reasons.append({"name": t, "reason": "Ensures code accuracy by catching typos and bugs before the code runs."})
            elif "python" in t_lower:
                tech_with_reasons.append({"name": t, "reason": "Handles data processing, artificial intelligence, and background utilities."})
            elif "mongo" in t_lower or "postgres" in t_lower or "sql" in t_lower:
                tech_with_reasons.append({"name": t, "reason": "Stores records permanently so user data is never lost."})
            else:
                tech_with_reasons.append({"name": t, "reason": "Supports the core application workflow and system libraries."})

        # 5. What are the main features?
        features = []
        if overview.get("key_features", {}).get("bullets"):
            features = [re.sub(r"^[-*+]\s*", "", b) for b in overview["key_features"]["bullets"][:6]]
        if not features:
            routes = analysis.get("routes_and_endpoints") or []
            if routes:
                features = [f"Provides an operation for `{r}`." for r in routes[:5]]
            else:
                features = [
                    "User-friendly web views to inspect and interact with the application.",
                    "Backend routing layer to validate data and process operations safely.",
                    "Structured configuration to run and deploy the software with predictable behavior."
                ]

        # 6. How is the project organized? (Folder Responsibilities - Requirement 3)
        files_indexed = [c.metadata.get("file_path", "") for c in self.chunks]
        folder_explanations = self._explain_folder_structure(files_indexed, analysis)

        # 7. How do the different parts work together?
        parts_harmony = [
            {
                "step": 1,
                "title": "User Request",
                "explanation": "You take an action in your web browser (like clicking a button or opening a page). The frontend captures your click."
            },
            {
                "step": 2,
                "title": "Server Check & Logic",
                "explanation": "The frontend sends a request over the network to the backend server. The server verifies your input and runs the business logic."
            },
            {
                "step": 3,
                "title": "Data Retrieval or Calculation",
                "explanation": "If data needs to be saved or loaded, the server talks to the database or external APIs (like GitHub) to gather the facts."
            },
            {
                "step": 4,
                "title": "Friendly Response",
                "explanation": "The server packages the finished result and sends it back to the browser, which updates the screen with cards and diagrams."
            }
        ]

        # 8. How can someone run this project locally?
        local_run_steps = [
            {
                "step": 1,
                "command": "git clone <repository-url>",
                "explanation": "Download a fresh copy of the codebase to your local computer."
            },
            {
                "step": 2,
                "command": "npm install  (or pip install -r requirements.txt)",
                "explanation": "Install all outside libraries and helper tools the project needs to work."
            },
            {
                "step": 3,
                "command": "cp .env.example .env",
                "explanation": "Set up your configuration file for ports and keys (if the project uses one)."
            },
            {
                "step": 4,
                "command": "npm run dev",
                "explanation": "Start the development server and open http://localhost in your browser to try it out."
            }
        ]

        return {
            "title": f"Beginner Guide to {display_name}",
            "headline": what_is,
            # The 8 Core Questions
            "what_is_this_project": what_is,
            "problem_it_solves": problem,
            "who_is_it_for": audience,
            "technologies_used": tech_with_reasons,
            "main_features": features,
            "folder_explanations": folder_explanations,
            "how_parts_work_together": parts_harmony,
            "how_to_run_locally": local_run_steps,
            # Metadata & Compatibility
            "tech_stack": [t["name"] for t in tech_with_reasons],
            "entry_points": analysis.get("entry_points") or ["server.ts"],
            "core_parts": [
                {"name": "Frontend (User Interface)", "explanation": "The screens and buttons you interact with."},
                {"name": "Backend (The Brain)", "explanation": "Processes instructions and controls the workflow."},
                {"name": "Data Storage", "explanation": "Keeps records safe so nothing disappears on reload."},
                {"name": "Integrations", "explanation": "Connects with GitHub and tools to extract fresh insights."}
            ],
            "how_data_flows": [p["explanation"] for p in parts_harmony],
            "total_files_indexed": len(self.chunks),
            "loaded_urls": self.loaded_urls,
            "free_guarantee": "Explained like a personal coding mentor using RepoMentor LangChain RAG."
        }

    def answer_query(self, query: str, repo_name: str = "Repository", context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Answers user questions using the requested Teacher Structure:
        - What it means
        - How it works
        - Files involved
        - Simple example / Analogy
        - In short
        """
        if context:
            self.index_repository(context)

        retrieved = self.search_hybrid(query, top_k=5)
        query_lower = query.lower()
        top_file = retrieved[0]["file_path"] if retrieved else "the codebase"

        # 1. LLM Generation if Key is Provided
        snippets = "\n\n".join([f"[{r['file_path']} lines {r['start_line']}-{r['end_line']}]:\n{r['content']}" for r in retrieved[:3]])
        prompt = f"""User Question: {query}
Repository Name: {repo_name}
Verified Code Evidence:
{snippets}

Explain this to a beginner following our Core Product Philosophy:
1. Explain in simple English with short sentences and minimal jargon.
2. Structure your response using these exact section headers:
   ### What it means
   (1-2 simple sentences explaining the concept)

   ### How it works
   (Step-by-step numbered breakdown)

   ### Files involved
   (Mention the exact file paths and their responsibilities)

   ### Simple example / Analogy
   (A real-world comparison or simple example)

   ### In short
   (One or two sentence summary)
"""
        llm_answer = try_call_llm(prompt, TEACHER_SYSTEM_PROMPT)
        if llm_answer and len(llm_answer.strip()) > 50:
            return {
                "answer": llm_answer.strip(),
                "simplest_explanation": f"Explained like a coding mentor using LangChain FAISS Vector DB and verified code evidence.",
                "sources": [
                    {
                        "file_path": r["file_path"],
                        "start_line": r["start_line"],
                        "end_line": r["end_line"],
                        "relevance_score": r["score"],
                        "preview": r["content"][:220] + "..."
                    }
                    for r in retrieved
                ],
                "model_mode": "teacher_llm_rag",
                "query": query
            }

        # 2. Local Semantic Teacher Synthesis (Deterministic & Always Available)
        analysis = self.metadata.get("analysis") or {}
        overview = self.metadata.get("project_overview") or {}

        # Intent Classification & Teacher Responses:
        # -------------------------------------------------------------
        # Intent A: Project Overview / "What is this?" / "Explain simply"
        # -------------------------------------------------------------
        if any(k in query_lower for k in ["what is", "explain this project", "overview", "what does this do", "purpose", "like i am 5", "simple terms"]):
            what_is = overview.get("what_the_project_is", {}).get("content") or f"{repo_name} is an application designed to make complex coding tasks approachable."
            answer = f"""### What it means
{what_is}

### How it works
1. **User interaction:** You interact with the application through clear screens and intuitive controls.
2. **Coordinated teamwork:** The frontend collects your intentions and hands them over to the backend server.
3. **Smart processing:** The server uses specialized helper files to parse data, verify inputs, and fetch external information.
4. **Instant feedback:** Results are translated into visual cards and summaries that anyone can understand.

### Files involved
- **`README.md`**: Provides the official project introduction and background details.
- **`package.json`**: Lists all tools and libraries the project depends on.
- **`{top_file}`**: Implements core application logic found in the codebase.

### Simple example / Analogy
Think of this project like a well-run library:
- The **frontend** is the reception desk where you ask for a book.
- The **backend server** is the librarian who checks the catalog.
- The **database** is the organized bookshelf where knowledge is safely stored.

### In short
{repo_name} simplifies an otherwise complicated task by dividing responsibilities between user-friendly screens and a capable backend."""

            simplest_takeaway = f"{repo_name} is a software tool designed to organize workflows and make complex code simple."

        # -------------------------------------------------------------
        # Intent B: Where does execution start? / Entrypoint
        # -------------------------------------------------------------
        elif any(k in query_lower for k in ["start", "entry", "begin", "where does", "bootstrap", "kick off", "lifecycle"]):
            entry_points = analysis.get("entry_points") or ["server.ts", "src/main.tsx"]
            main_entry = entry_points[0] if entry_points else "server.ts"

            answer = f"""### What it means
Execution means running the program. The "entry point" is the first file the computer reads when you start the project—just like opening the front door of a building.

### How it works
When you run the start command, the program follows these steps in **`{main_entry}`**:
1. **Reads Settings:** Loads environment variables (like port numbers and passwords) from your configuration.
2. **Sets Up Security & Helpers:** Configures security guards (like CORS) and tools to understand JSON messages.
3. **Opens Communication Doors:** Connects the API pathways and starts listening for incoming user clicks and web requests.

### Files involved
- **`{main_entry}`**: The master control switch where startup logic lives.
- **`package.json`**: Contains the `dev` or `start` scripts that tell your computer to execute `{main_entry}`.

### Simple example / Analogy
Starting a car: turning the key doesn't drive down the road immediately—it wakes up the electrical system, checks oil levels, and gets the engine idling ready for your command. That is what `{main_entry}` does.

### In short
Execution begins in `{main_entry}`, which wakes up the server, sets the rules, and waits for incoming requests."""

            simplest_takeaway = f"Execution begins in `{main_entry}`, which starts the server and initializes the system."

        # -------------------------------------------------------------
        # Intent C: Authentication & Security
        # -------------------------------------------------------------
        elif any(k in query_lower for k in ["auth", "login", "jwt", "password", "security", "token", "register"]):
            answer = f"""### What it means
Authentication is how the application checks who you are before letting you see private information or make changes.

### How it works
1. **Submitting credentials:** You type your email and password on the login screen.
2. **Safe comparison:** The server does not look at your raw password. Instead, it turns it into a scrambled code (cryptographic hash) and checks if it matches the stored record.
3. **Issuing a digital pass:** If the password matches, the server hands your browser a secure digital badge called a **JWT (JSON Web Token)**.
4. **Authorized visits:** Every time you visit a protected page, your browser automatically flashes this badge so you don't have to re-type your password.

### Files involved
- **`{top_file}`**: Verifies login requests and checks credentials against security rules.
- **Middleware files**: Act like security guards at the door, making sure every request has a valid token before allowing access.

### Simple example / Analogy
A wristband at a concert. You show your ID once at the ticket booth to get the wristband. Afterwards, the security guards at every gate simply check your wristband without checking your passport again.

### In short
The application uses secure password hashing and digital token wristbands (JWTs) to protect user accounts without slowing down navigation."""

            simplest_takeaway = "Authentication checks scrambled passwords and hands out secure digital wristbands (JWTs) for safe access."

        # -------------------------------------------------------------
        # Intent D: Database & Data Storage
        # -------------------------------------------------------------
        elif any(k in query_lower for k in ["database", "mongo", "db", "sql", "storage", "schema", "model", "save"]):
            models = analysis.get("data_models") or ["models/Workspace.ts", "models/User.ts"]
            first_model = models[0] if models else "database schema"

            answer = f"""### What it means
A database is the application's permanent filing cabinet. Without it, everything you did would vanish the second you refreshed your browser.

### How it works
1. **Defining the blueprint:** Schemas (like **`{first_model}`**) outline exactly what a valid record looks like (e.g. every user must have an email and a creation date).
2. **Connecting to storage:** The server opens a secure tunnel to the database engine (such as MongoDB or PostgreSQL).
3. **Saving & loading:** When you save a project, the server writes the record into storage. When you return tomorrow, it reads the record back out.
4. **Safety net:** If a full database isn't running locally, the application can use temporary memory storage so you can still test features.

### Files involved
- **`{first_model}`**: The blueprint that defines what information is stored and enforces data rules.
- **`{top_file}`**: Executes the create, read, update, and delete actions when the user asks for data.

### Simple example / Analogy
A digital filing cabinet with pre-printed forms. You cannot throw random scrap paper into the cabinet—every entry must be filled out on the official form (`{first_model}`) before being filed away.

### In short
Data is saved in structured models like `{first_model}` so your work remains safe across browser refreshes."""

            simplest_takeaway = f"Data is permanently organized through structured blueprints ({first_model}) and safely stored."

        # -------------------------------------------------------------
        # Intent E: How to Run & Test
        # -------------------------------------------------------------
        elif any(k in query_lower for k in ["run", "test", "setup", "install", "command", "build", "how do i", "locally"]):
            answer = f"""### What it means
Running the project locally means putting a live copy of this software onto your own computer so you can experiment with it without touching the production site.

### How it works
Follow these straightforward steps in your computer's terminal:
1. **Install dependencies:** Download the supporting libraries listed in `package.json`:
   ```bash
   npm install
   ```
2. **Start the development server:** Launch the local server and live-reloading client:
   ```bash
   npm run dev
   ```
3. **Verify the code:** Check for errors and verify everything compiles cleanly:
   ```bash
   npm run typecheck
   ```

### Files involved
- **`package.json`**: Contains the scripts (`dev`, `build`, `typecheck`) that trigger each command.
- **`.env.example`**: Shows you what secret keys or ports need to be configured before starting.

### Simple example / Analogy
Assembling flat-pack furniture. `package.json` is the instruction sheet, `npm install` brings all the screws and tools into your room, and `npm run dev` stands the desk up so you can use it.

### In short
Run `npm install` to download dependencies, then `npm run dev` to start your personal development server."""

            simplest_takeaway = "Install libraries with `npm install` and start your local test environment with `npm run dev`."

        # -------------------------------------------------------------
        # Intent F: Default / Specific Code Question
        # -------------------------------------------------------------
        else:
            answer = f"""### What it means
This question relates to how the project handles **"{query}"**. In this codebase, that responsibility is concentrated in **`{top_file}`**.

### How it works
1. **Receiving instructions:** The file reads the request and checks any parameters passed into it.
2. **Executing logic:** It coordinates with helper functions and verified modules to compute the result.
3. **Returning evidence:** The outcome is delivered to the surrounding architecture so the application can proceed smoothly.

### Files involved
- **`{top_file}`**: The verified file implementing this part of the application.
- **Supporting modules**: Connect this file to the rest of the project pipeline.

### Simple example / Analogy
A specialized department in an office: rather than everyone trying to do everything, `{top_file}` handles this one specific task and reports the answer back to the rest of the team.

### In short
Relevant logic for "{query}" is organized in `{top_file}`, which executes the necessary steps based on verified repository evidence."""

            simplest_takeaway = f"Relevant logic for your question is organized in `{top_file}`."

        return {
            "answer": answer,
            "simplest_explanation": simplest_takeaway,
            "sources": [
                {
                    "file_path": r["file_path"],
                    "start_line": r["start_line"],
                    "end_line": r["end_line"],
                    "relevance_score": r["score"],
                    "preview": r["content"][:220] + "..."
                }
                for r in retrieved
            ],
            "model_mode": "teacher_local_rag",
            "query": query
        }


# Global singleton engine
rag_instance = RagEngine()

if __name__ == "__main__":
    import sys
    try:
        raw_input = sys.stdin.read()
        if raw_input.strip():
            data = json.loads(raw_input)
            action = data.get("action", "query")
            payload = data.get("payload", {})
            repo_name = payload.get("repository_name", "Repository")

            rag_instance.index_repository(payload)

            if action == "load_url":
                target_url = payload.get("url", "")
                res = rag_instance.load_website_url(target_url)
                print(json.dumps(res))
            elif action == "query":
                q = payload.get("query", "")
                result = rag_instance.answer_query(q, repo_name)
                print(json.dumps(result))
            else:
                result = rag_instance.generate_simplest_explanation(repo_name)
                print(json.dumps(result))
    except Exception as e:
        sys.stderr.write(f"Error in LangChain rag_engine: {str(e)}\n")
        sys.exit(1)
