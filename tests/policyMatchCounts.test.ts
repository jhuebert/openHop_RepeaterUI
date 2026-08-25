import { it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

vi.mock('@/utils/api', () => ({
  default: {
    getPolicyDocument: vi.fn(),
    getLogs: vi.fn(),
    validatePolicyDocument: vi.fn(),
    updatePolicyDocument: vi.fn(),
  },
}));

vi.mock('@/composables/useUnsavedChanges', () => ({
  useUnsavedChanges: () => ({
    showUnsavedModal: { value: false },
    requestLeave: vi.fn(),
    handleDiscard: vi.fn(),
    handleSave: vi.fn(),
    handleCancel: vi.fn(),
  }),
}));

import ApiService from '@/utils/api';
import PolicyEngineSettings from '@/components/configuration/PolicyEngineSettings.vue';

it('displays per-rule match counts from the policy document', async () => {
  vi.mocked(ApiService.getPolicyDocument).mockResolvedValue({
    success: true,
    data: {
      policy_engine: {
        enabled: true,
        default_action: 'allow',
        rules: [
          { id: 1, name: 'Block noisy', enabled: true, if: { all: [{ field: 'hop_count', op: 'greater_than', value: 4 }] }, then: { action: 'drop' } },
          { id: 2, name: 'Local only', enabled: true, if: { all: [{ field: 'local_transmission', op: 'equals', value: true }] }, then: { action: 'allow' } },
          { id: 3, name: 'Log long paths', enabled: true, if: { all: [{ field: 'path_hash_size', op: 'equals', value: 2 }] }, then: { action: 'log_only' } },
        ],
        objects: {},
      },
      groups: { channel_hashes: [], pubkeys: [] },
      match_counts: { 1: 2, 2: 1 },
    },
  } as never);

  const wrapper = mount(PolicyEngineSettings);
  await flushPromises();

  const matchCells = wrapper.findAll('tbody tr').map((row) => row.findAll('td')[5].text());
  expect(matchCells).toEqual(['2', '1', '0']);
});

it('shows zero for every rule when match_counts is absent', async () => {
  vi.mocked(ApiService.getPolicyDocument).mockResolvedValue({
    success: true,
    data: {
      policy_engine: {
        enabled: true,
        default_action: 'allow',
        rules: [{ id: 1, name: 'Block noisy', enabled: true, if: { all: [{ field: 'hop_count', op: 'greater_than', value: 4 }] }, then: { action: 'drop' } }],
        objects: {},
      },
      groups: { channel_hashes: [], pubkeys: [] },
    },
  } as never);

  const wrapper = mount(PolicyEngineSettings);
  await flushPromises();

  const matchCells = wrapper.findAll('tbody tr').map((row) => row.findAll('td')[5].text());
  expect(matchCells).toEqual(['0']);
});

beforeEach(() => {
  vi.clearAllMocks();
});
