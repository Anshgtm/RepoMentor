"""
RepoMentor Python RAG API Server
FastAPI microservice running on port 8001.
Free, LangChain FAISS code & website intelligence, and interactive Q&A.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Optional, Any
import uvicorn
import os
try:
    from rag_service.rag_engine import rag_instance
except ImportError:
    from rag_engine import rag_instance

app = FastAPI(
    title="RepoMentor LangChain RAG Service",
    description="LangChain FAISS Multi-Source Code & Web Intelligence Assistant",
    version="1.2.0"
)

# Enable CORS for frontend (5000) and backend (8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "repomentor-langchain-rag",
        "framework": "langchain",
        "vector_store": "faiss",
        "token_limit": "unlimited",
        "cost": "free",
        "total_chunks_indexed": len(rag_instance.chunks),
        "loaded_urls": rag_instance.loaded_urls
    }


@app.post("/load-url")
def load_website_url(req: Dict[str, Any]):
    try:
        url = req.get("url", "").strip()
        if not url:
            raise HTTPException(status_code=400, detail="URL cannot be empty.")
        res = rag_instance.load_website_url(url)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/index")
def index_repository(req: Dict[str, Any]):
    try:
        rag_instance.index_repository(req)
        return {
            "status": "success",
            "message": f"Successfully indexed repository into {len(rag_instance.chunks)} FAISS chunks.",
            "chunks_count": len(rag_instance.chunks),
            "loaded_urls": rag_instance.loaded_urls
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/summarize")
def summarize_repository(req: Dict[str, Any]):
    try:
        rag_instance.index_repository(req)
        summary = rag_instance.generate_simplest_explanation(repo_name=req.get("repository_name", "Repository"))
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/query")
def query_repository(req: Dict[str, Any]):
    try:
        query = req.get("query", "").strip()
        if not query:
            raise HTTPException(status_code=400, detail="Query cannot be empty.")

        rag_instance.index_repository(req)
        result = rag_instance.answer_query(query=query, repo_name=req.get("repository_name", "Repository"))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    port = int(os.environ.get("RAG_PORT", 8001))
    print(f"Starting RepoMentor LangChain FAISS RAG Service on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
