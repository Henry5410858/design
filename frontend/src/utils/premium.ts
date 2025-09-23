import API_ENDPOINTS from '@/config/api';

export type ProposalItem = {
  title: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  enhancedUrl?: string;
};

export type ProposalClient = {
  name: string;
  email?: string;
  phone?: string;
  quote?: string;
  industry?: string;
  valueProps?: string[];
};

export type ProposalTheme = {
  primary?: string;   // hex color
  secondary?: string; // hex color
  logoUrl?: string;   // public URL
};

export type GenerateProposalPayload = {
  client: ProposalClient;
  items: ProposalItem[];
  theme?: ProposalTheme;
};

export type EnhancementPreset = 'standard' | 'vivid' | 'soft';

export type EnhanceResponse = {
  url: string;
  publicId?: string;
  originalUrl?: string;
  originalPublicId?: string;
  cached?: boolean;
  preset?: EnhancementPreset;
};

export async function enhanceImage(
  input: File | string,
  token: string,
  preset: EnhancementPreset = 'standard'
): Promise<EnhanceResponse> {
  const form = new FormData();
  if (typeof input === 'string') {
    form.append('url', input);
  } else {
    form.append('image', input);
  }
  form.append('preset', preset);

  const res = await fetch(API_ENDPOINTS.IMAGE_ENHANCE, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Image enhancement failed');
  }

  return res.json();
}

export async function enhanceImagesBatch(
  inputs: Array<File | string>,
  token: string,
  preset: EnhancementPreset = 'standard'
): Promise<EnhanceResponse[]> {
  const results: EnhanceResponse[] = [];
  for (const input of inputs) {
    // Sequential by default to avoid rate spikes; could be parallelized with Promise.allSettled
    // if backend rate limits are acceptable.
    try {
      const r = await enhanceImage(input, token, preset);
      results.push(r);
    } catch (e) {
      // Push a placeholder error result to keep positions aligned
      results.push({ url: '', cached: false, preset });
    }
  }
  return results;
}

export async function getEnhanceUsage(token: string): Promise<{ month: string; count: number; quota: number }> {
  const res = await fetch(`${API_ENDPOINTS.IMAGE_ENHANCE.replace('/enhance', '')}/usage`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch usage');
  }
  return res.json();
}

export async function generateProposal(
  payload: GenerateProposalPayload,
  token: string
): Promise<Blob> {
  const res = await fetch(API_ENDPOINTS.PROPOSAL_GENERATE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Proposal generation failed: ${errText || res.statusText}`);
  }

  return res.blob();
}