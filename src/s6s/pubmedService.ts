import { RegistryMatchData } from '../t3s/citationTypes';

export async function queryPubmedByPmid(pmid: string): Promise<RegistryMatchData | null> {
  const response = await fetch(
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${encodeURIComponent(pmid)}&retmode=json`
  );
  if (!response.ok) return null;

  const json = await response.json();
  const doc = json?.result?.[pmid];
  if (!doc || doc.error || !doc.title) return null;

  return {
    exists: true,
    source: 'PubMed NCBI E-utilities (200 OK)',
    id: `PMID: ${pmid}`,
    url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    title: doc.title,
    authors: Array.isArray(doc.authors) ? doc.authors.slice(0, 4).map((a: { name: string }) => a.name).join(', ') : 'PubMed Indexed Authors',
    year: (doc.pubdate || '').slice(0, 4) || 'Verified',
    venue: doc.fulljournalname || doc.source || 'PubMed Indexed Journal',
    abstract: ''
  };
}
