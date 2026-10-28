import { AtomicClaim } from '../t3s/citationTypes';

export interface DiffEntry {
  claimId: string;
  type: 'unchanged' | 'contradicted' | 'phantom';
  originalText: string;
  repairedText: string;
}

/**
 * Generates side-by-side Red/Green operational diff entries for all extracted claims.
 */
export function calculateClaimDiffs(claims: AtomicClaim[]): DiffEntry[] {
  return claims.map(claim => {
    const reg = claim.registryData;
    if (claim.status === 'PHANTOM' && reg?.suggestedRepair) {
      return {
        claimId: claim.id,
        type: 'phantom',
        originalText: claim.originalSentence,
        repairedText: reg.suggestedRepair.replacementSentence
      };
    }
    if (claim.status === 'CONTRADICTED' && reg?.numericDiscrepancy) {
      return {
        claimId: claim.id,
        type: 'contradicted',
        originalText: claim.originalSentence,
        repairedText: reg.numericDiscrepancy.repairedSentence
      };
    }
    return {
      claimId: claim.id,
      type: 'unchanged',
      originalText: claim.originalSentence,
      repairedText: claim.sentence
    };
  });
}
