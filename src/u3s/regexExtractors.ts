import { AtomicClaim, CitationQueryType } from '../t3s/citationTypes';

/**
 * Decomposes raw text into atomic (Claim, Citation, Numeric Metrics) tuples.
 */
export function extractAtomicClaims(text: string): AtomicClaim[] {
  if (!text || !text.trim()) return [];

  const protectedText = text
    .replace(/et al\./gi, 'et_al_DOT')
    .replace(/e\.g\./gi, 'e_g_DOT')
    .replace(/i\.e\./gi, 'i_e_DOT')
    .replace(/vs\./gi, 'vs_DOT')
    .replace(/Dr\./g, 'Dr_DOT')
    .replace(/Prof\./g, 'Prof_DOT');

  const rawSentences = protectedText
    .split(/(?<=[.!?])\s+/)
    .map(s =>
      s
        .replace(/et_al_DOT/g, 'et al.')
        .replace(/e_g_DOT/g, 'e.g.')
        .replace(/i_e_DOT/g, 'i.e.')
        .replace(/vs_DOT/g, 'vs.')
        .replace(/Dr_DOT/g, 'Dr.')
        .replace(/Prof_DOT/g, 'Prof.')
        .trim()
    )
    .filter(Boolean);

  const extractedClaims: AtomicClaim[] = [];

  rawSentences.forEach((sentence, idx) => {
    const doiMatch = sentence.match(/(?:doi\s*[:=]\s*|https?:\/\/doi\.org\/)?(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)/i);
    const arxivMatch = sentence.match(/arXiv\s*[:=]\s*(\d{4}\.\d{4,5}(?:v\d+)?)/i);
    const pmidMatch = sentence.match(/(?:PMID|PubMed\s*ID)\s*[:=]?\s*(\d{6,9})/i);
    const parentheticalMatch = sentence.match(/\(([A-Z][A-Za-z'\-]+(?:\s+et\s+al\.|\s*(?:&|and)\s*[A-Z][A-Za-z'\-]+)?\s*,\s*\d{4}[^)]*)\)/);
    const inlineAuthorMatch = sentence.match(/([A-Z][A-Za-z'\-]+(?:\s+et\s+al\.|\s*(?:&|and)\s*[A-Z][A-Za-z'\-]+)?\s*\(\d{4}\))/);

    const numberMatches =
      sentence.match(/\b\d+(?:,\d{3})*(?:\.\d+)?\s*(?:%|mg\/kg|mg|kg|g\/L|mL|billion|million|days|weeks|months|years)?\b/gi) || [];

    const filteredMetrics = numberMatches
      .map(n => n.trim())
      .filter(n => {
        if (/^(19\d\d|20[0-3]\d)$/.test(n)) return false;
        if (pmidMatch && n.includes(pmidMatch[1])) return false;
        if (arxivMatch && arxivMatch[1].includes(n)) return false;
        if (doiMatch && doiMatch[1].includes(n)) return false;
        return /\d/.test(n) && (/[%]|mg|kg|billion|million|,|\./i.test(n) || parseInt(n, 10) > 5);
      });

    const hasCitation = Boolean(doiMatch || arxivMatch || pmidMatch || parentheticalMatch || inlineAuthorMatch);

    if (hasCitation) {
      let lookupKey = '';
      let citationDisplay = '';
      let queryType: CitationQueryType = 'search';

      if (doiMatch) {
        lookupKey = doiMatch[1].replace(/[).,;]+$/, '').toLowerCase();
        citationDisplay = parentheticalMatch ? `(${parentheticalMatch[1]})` : `doi:${doiMatch[1].replace(/[).,;]+$/, '')}`;
        queryType = 'doi';
      } else if (arxivMatch) {
        lookupKey = arxivMatch[1].replace(/[).,;]+$/, '').toLowerCase();
        citationDisplay = parentheticalMatch ? `(${parentheticalMatch[1]})` : `arXiv:${arxivMatch[1]}`;
        queryType = 'arxiv';
      } else if (pmidMatch) {
        lookupKey = pmidMatch[1].trim();
        citationDisplay = `PMID: ${lookupKey}`;
        queryType = 'pmid';
      } else if (parentheticalMatch) {
        citationDisplay = `(${parentheticalMatch[1]})`;
        lookupKey = parentheticalMatch[1].trim();
        queryType = 'author_year';
      } else if (inlineAuthorMatch) {
        citationDisplay = inlineAuthorMatch[1];
        lookupKey = inlineAuthorMatch[1].trim();
        queryType = 'author_year';
      }

      extractedClaims.push({
        id: `claim-${idx + 1}`,
        index: extractedClaims.length + 1,
        sentence,
        originalSentence: sentence,
        citationDisplay,
        lookupKey,
        queryType,
        metrics: Array.from(new Set(filteredMetrics)),
        status: 'PENDING',
        registryData: null,
        latencyMs: 0,
        isRepaired: false
      });
    }
  });

  return extractedClaims;
}
