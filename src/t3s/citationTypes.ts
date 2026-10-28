export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'CONTRADICTED' | 'PHANTOM';

export type CitationQueryType = 'doi' | 'arxiv' | 'pmid' | 'author_year' | 'search';

export interface NumericDiscrepancy {
  claimedNumber: string;
  actualNumber: string;
  explanation: string;
  repairedSentence: string;
}

export interface SuggestedRepair {
  citationText: string;
  replacementSentence: string;
  title: string;
  authors: string;
  year: string;
  url: string;
  id: string;
}

export interface RegistryMatchData {
  exists: boolean;
  source: string;
  id: string;
  url?: string;
  title?: string;
  authors?: string;
  year?: string;
  venue?: string;
  abstract?: string;
  reason?: string;
  verifiedNumbers?: string[];
  numericDiscrepancy?: NumericDiscrepancy;
  suggestedRepair?: SuggestedRepair;
}

export interface AtomicClaim {
  id: string;
  index: number;
  sentence: string;
  originalSentence: string;
  citationDisplay: string;
  lookupKey: string;
  queryType: CitationQueryType;
  metrics: string[];
  status: VerificationStatus;
  registryData: RegistryMatchData | null;
  numericCheckText?: string;
  latencyMs: number;
  isRepaired: boolean;
}

export interface ApiPingStatus {
  name: 'Crossref' | 'PubMed' | 'OpenAlex' | 'arXiv';
  connected: boolean;
  latencyMs: number;
}
