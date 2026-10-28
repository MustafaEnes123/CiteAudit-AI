import { AtomicClaim } from '../t3s/citationTypes';

/**
 * Deterministic & optional BYOK LLM auto-repair engine that replaces phantom citations
 * with verified peer-reviewed sources and corrects numeric discrepancies.
 */
export function applyDeterministicRepair(claim: AtomicClaim, fullDraft: string): { updatedClaim: AtomicClaim; updatedDraft: string } {
  if (claim.status === 'VERIFIED') {
    return { updatedClaim: claim, updatedDraft: fullDraft };
  }

  let replacementSentence = claim.sentence;

  if (claim.status === 'CONTRADICTED' && claim.registryData?.numericDiscrepancy) {
    const { claimedNumber, actualNumber, repairedSentence } = claim.registryData.numericDiscrepancy;
    replacementSentence = repairedSentence || claim.sentence.replace(claimedNumber, actualNumber);
    claim.sentence = replacementSentence;
    claim.status = 'VERIFIED';
    claim.isRepaired = true;
    claim.numericCheckText = `Repaired (${actualNumber} verified)`;
  } else if (claim.status === 'PHANTOM' && claim.registryData?.suggestedRepair) {
    const repair = claim.registryData.suggestedRepair;
    replacementSentence = repair.replacementSentence;
    claim.sentence = replacementSentence;
    claim.citationDisplay = repair.citationText;
    claim.status = 'VERIFIED';
    claim.isRepaired = true;
    claim.numericCheckText = 'Repaired with Verified Source';
    claim.registryData = {
      exists: true,
      source: 'OpenAlex / Crossref Auto-Repair Engine',
      id: repair.id,
      url: repair.url,
      title: repair.title,
      authors: repair.authors,
      year: repair.year,
      venue: 'Peer-Reviewed Registry Match',
      abstract: `Verified replacement source grounded via CiteAudit.ai Repair Engine: "${repair.title}" (${repair.year}).`
    };
  }

  const updatedDraft = fullDraft.includes(claim.originalSentence)
    ? fullDraft.replace(claim.originalSentence, replacementSentence)
    : fullDraft;

  return { updatedClaim: claim, updatedDraft };
}
