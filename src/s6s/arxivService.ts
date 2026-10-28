import { RegistryMatchData } from '../t3s/citationTypes';
import { reconstructOpenAlexAbstract } from './openalexService';

export async function queryArxivById(arxivId: string): Promise<RegistryMatchData | null> {
  const response = await fetch(`https://api.openalex.org/works/https://doi.org/10.48550/arXiv.${encodeURIComponent(arxivId)}`);
  if (!response.ok) return null;

  const item = await response.json();
  return {
    exists: true,
    source: 'arXiv / OpenAlex API (200 OK)',
    id: `arXiv:${arxivId}`,
    url: `https://arxiv.org/abs/${arxivId}`,
    title: item.title || 'arXiv Preprint',
    authors: Array.isArray(item.authorships)
      ? item.authorships.slice(0, 4).map((a: { author?: { display_name?: string } }) => a.author?.display_name).filter(Boolean).join(', ')
      : 'arXiv Authors',
    year: item.publication_year?.toString() || 'Verified',
    venue: 'arXiv Open Access Repository',
    abstract: reconstructOpenAlexAbstract(item.abstract_inverted_index)
  };
}
