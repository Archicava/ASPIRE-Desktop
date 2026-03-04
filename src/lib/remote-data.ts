import { CaseRecord } from '../types';
import { getCaseRecord as getLocalCaseRecord, getCaseRecords as getLocalCaseRecords } from './data';
import {
  deleteCase,
  DesktopApiError,
  getCase,
  getCStoreStatus,
  getR1FsStatus,
  listCases,
  retryCase
} from './web-api';

export async function loadCaseRecords(): Promise<CaseRecord[]> {
  try {
    return await listCases();
  } catch (error) {
    if (error instanceof DesktopApiError && error.status === 401) {
      throw error;
    }
    return getLocalCaseRecords();
  }
}

export async function loadCaseRecord(caseId: string): Promise<CaseRecord | undefined> {
  try {
    return await getCase(caseId);
  } catch (error) {
    if (error instanceof DesktopApiError && error.status === 401) {
      throw error;
    }
    return getLocalCaseRecord(caseId);
  }
}

export async function loadPlatformStatus(): Promise<{
  cstore?: Record<string, unknown>;
  r1fs?: Record<string, unknown>;
}> {
  const [cstore, r1fs] = await Promise.allSettled([getCStoreStatus(), getR1FsStatus()]);

  return {
    cstore: cstore.status === 'fulfilled' ? cstore.value : undefined,
    r1fs: r1fs.status === 'fulfilled' ? r1fs.value : undefined
  };
}

export async function retryCasePrediction(caseId: string): Promise<{
  success: boolean;
  caseRecord?: CaseRecord;
  error?: string;
}> {
  try {
    return await retryCase(caseId);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Retry failed'
    };
  }
}

export async function removeCaseRecord(caseId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const response = await deleteCase(caseId);
    return {
      success: response.success,
      error: response.error
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove case'
    };
  }
}
