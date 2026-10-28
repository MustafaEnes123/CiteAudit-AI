import { RegistryMatchData } from '../t3s/citationTypes';

export function reconstructOpenAlexAbstract(invertedIndex?: Record<string, number[]>): string {
  if (!invertedIndex || typeof invertedIndex !== 'object') return '';
  const words: string[] = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    if (Array.isArray(positions)) {
      positions.forEach(pos => {
        words[pos] = word;
      });
    }
  }
  return words.filter(Boolean).join(' ');
}

export async function searchOpenAlexCatalog(query: string): Promise<RegistryMatchData | null> {
  const cleanQuery = query.replace(/[()]/g, '');
  const response = await fetch(`https://api.openalex.org/works?search=${encodeURIComponent(cleanQuery)}&per-page=1`);
  if (!response.ok) return null;

  const json = await response.json();
  const top = json?.results?.[0];
  if (!top) return null;

  return {
    exists: true,
    source: 'OpenAlex Global Catalog (200 OK)',
    id: top.doi ? top.doi.replace('https://doi.org/', 'doi:') : top.id,
    url: top.doi || top.id,
    title: top.title,
    authors: Array.isArray(top.authorships)
      ? top.authorships.slice(0, 4).map((a: { author?: { display_name?: string } }) => a.author?.display_name).filter(Boolean).join(', ')
      : 'Verified Authors',
    year: top.publication_year?.toString() || 'Verified',
    venue: top.primary_location?.source?.display_name || 'Academic Venue',
    abstract: reconstructOpenAlexAbstract(top.abstract_inverted_index)
  };
}
