import { RegistryMatchData } from '../t3s/citationTypes';

export async function queryCrossrefByDoi(doi: string, politeEmail?: string): Promise<RegistryMatchData | null> {
  const emailParam = politeEmail ? `?mailto=${encodeURIComponent(politeEmail)}` : '';
  const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}${emailParam}`, {
    headers: { Accept: 'application/json' }
  });
  if (!response.ok) return null;

  const json = await response.json();
  const item = json.message;
  return {
    exists: true,
    source: 'Crossref REST API (200 OK)',
    id: `doi:${item.DOI}`,
    url: item.URL || `https://doi.org/${item.DOI}`,
    title: Array.isArray(item.title) ? item.title[0] : item.title || 'Verified DOI Work',
    authors: Array.isArray(item.author)
      ? item.author.slice(0, 4).map((a: { given?: string; family?: string }) => `${a.given || ''} ${a.family || ''}`.trim()).join(', ')
      : 'Verified Authors',
    year: item.issued?.['date-parts']?.[0]?.[0]?.toString() || 'Verified',
    venue: Array.isArray(item['container-title']) ? item['container-title'][0] : 'Academic Journal',
    abstract: item.abstract ? item.abstract.replace(/<[^>]+>/g, '') : ''
  };
}
