import { AtomicClaim } from '../t3s/citationTypes';
import { extractAtomicClaims } from '../u3s/regexExtractors';
import { queryCrossrefByDoi } from '../s6s/crossrefService';
import { queryPubmedByPmid } from '../s6s/pubmedService';
import { searchOpenAlexCatalog } from '../s6s/openalexService';
import { queryArxivById } from '../s6s/arxivService';

export async function runCitationAuditPipeline(text: string, politeEmail?: string): Promise<AtomicClaim[]> {
  const claims = extractAtomicClaims(text);
  await Promise.all(
    claims.map(async claim => {
      const t0 = performance.now();
      let match = null;
      try {
        if (claim.queryType === 'doi') {
          match = await queryCrossrefByDoi(claim.lookupKey, politeEmail);
        } else if (claim.queryType === 'pmid') {
          match = await queryPubmedByPmid(claim.lookupKey);
        } else if (claim.queryType === 'arxiv') {
          match = await queryArxivById(claim.lookupKey);
        } else {
          match = await searchOpenAlexCatalog(claim.lookupKey);
        }
      } catch {
        match = null;
      }
      claim.latencyMs = Math.round(performance.now() - t0);
      if (match && match.exists) {
        claim.registryData = match;
        claim.status = 'VERIFIED';
      } else {
        claim.status = 'PHANTOM';
      }
    })
  );
  return claims;
}
