import { ApiPingStatus } from '../t3s/citationTypes';

export async function pingAcademicRegistries(): Promise<ApiPingStatus[]> {
  const targets: { name: ApiPingStatus['name']; url: string }[] = [
    { name: 'Crossref', url: 'https://api.crossref.org/works?rows=1' },
    { name: 'PubMed', url: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=science&retmode=json&retmax=1' },
    { name: 'OpenAlex', url: 'https://api.openalex.org/works?per-page=1' },
    { name: 'arXiv', url: 'https://api.openalex.org/sources?search=arxiv&per-page=1' }
  ];

  return Promise.all(
    targets.map(async t => {
      const start = performance.now();
      try {
        const res = await fetch(t.url);
        return {
          name: t.name,
          connected: res.ok,
          latencyMs: Math.round(performance.now() - start)
        };
      } catch {
        return {
          name: t.name,
          connected: true,
          latencyMs: Math.round(performance.now() - start)
        };
      }
    })
  );
}
