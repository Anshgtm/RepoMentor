import { ExternalLink, Github, Star, GitFork, CircleAlert, Boxes, Code2, Database, Route } from 'lucide-react'
import type { GithubSummary as GithubSummaryData, ProjectOverview } from '../../types/api'

export function GithubSummary({ summary, loading, error }: { summary?: GithubSummaryData; loading: boolean; error?: unknown }) {
  if (loading) return <section className="github-summary panel"><div className="summary-loading"><Github size={18}/><span>Reading repository context...</span></div></section>
  if (error) return <section className="github-summary panel"><div className="summary-loading is-error"><CircleAlert size={18}/><span>{apiErrorMessage(error, 'Unable to load project description.')}</span></div></section>
  if (!summary) return null
  return <section className={`github-summary panel ${summary.available ? 'is-available' : ''}`}><div className="summary-heading"><div className="summary-title"><span className="github-icon"><Github size={17}/></span><div><p className="eyebrow">Project understanding</p><h2>{summary.owner && summary.name ? `${summary.owner}/${summary.name}` : 'Repository link'}</h2></div></div>{summary.html_url && <a className="summary-link" href={summary.html_url} target="_blank" rel="noreferrer">Open on GitHub <ExternalLink size={14}/></a>}</div>{summary.project_overview ? <ProjectOverviewView overview={summary.project_overview}/> : <div className="project-purpose"><div className="purpose-label"><p className="eyebrow">What this project is</p><span className={`description-badge ${summary.description_source}`}>{summary.description_source === 'readme' ? 'README analysis' : summary.description_source === 'inferred' ? 'Repository analysis' : 'Needs context'}</span></div><p className="purpose-copy">{summary.project_description}</p></div>}{summary.analysis && <AnalysisEvidence analysis={summary.analysis}/>} {summary.reason && <p className="summary-reason"><CircleAlert size={14}/>{summary.reason}</p>}{summary.available && <div className="summary-meta"><span><Star size={14}/>{summary.stars?.toLocaleString()} stars</span><span><GitFork size={14}/>{summary.forks?.toLocaleString()} forks</span><span>{summary.language || 'Mixed language'}</span><span>{summary.default_branch} branch</span></div>}{summary.readme_excerpt && <blockquote>README excerpt: “{summary.readme_excerpt}”</blockquote>}</section>
}

function apiErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'response' in error) return (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || fallback
  return fallback
}

function ProjectOverviewView({ overview }: { overview: ProjectOverview }) {
  const sections = Object.values(overview)
  return <div className="project-overview">{sections.map(section => <section className="overview-section" key={section.title}><h3>{section.title}</h3><p>{section.content}</p>{section.bullets && <ul>{section.bullets.map((bullet, index) => <li key={`${section.title}-${index}`}>{bullet}</li>)}</ul>}</section>)}</div>
}

function AnalysisEvidence({ analysis }: { analysis: NonNullable<import('../../types/api').GithubSummary['analysis']> }) {
  const rows = [{ icon: <Boxes size={14}/>, label: 'Files analyzed', value: analysis.files_analyzed.length.toString() }, { icon: <Code2 size={14}/>, label: 'Entry points', value: analysis.entry_points.join(', ') || 'Not detected' }, { icon: <Route size={14}/>, label: 'Routes', value: analysis.routes_and_endpoints.length ? analysis.routes_and_endpoints.slice(0, 5).join(' · ') : 'Not detected' }, { icon: <Database size={14}/>, label: 'Data layer', value: analysis.data_models.join(', ') || 'Not detected' }]
  return <div className="analysis-evidence"><div className="analysis-heading"><p className="eyebrow">Code-grounded evidence</p><span>{analysis.technologies.join(' · ') || 'Repository scan'}</span></div>{rows.map(row => <div className="analysis-row" key={row.label}><span className="analysis-row-label">{row.icon}{row.label}</span><strong>{row.value}</strong></div>)}</div>
}
