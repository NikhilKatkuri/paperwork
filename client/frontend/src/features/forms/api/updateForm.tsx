'use client';

import { useState } from 'react';
import { syncQueueRepository } from '../lib/sync-queue.repository';
import { SyncQueueDB } from '../lib/sync-queue.db';
import { endpoints } from '@/api/endpoints';

export function groupByOperation<T extends { operation: 'create' | 'update' | 'delete' }>(operations: T[]) {
  return operations.reduce(
    (acc, item) => {
      acc[item.operation].push(item);
      return acc;
    },
    {
      create: [] as T[],
      update: [] as T[],
      delete: [] as T[],
    }
  );
}

function UpdateForm() {
    const [saving, setSaving] = useState<boolean>(false);

    const handleUpdate = async (id: string) => {
        setSaving(true);
        try {
            const q = await syncQueueRepository.getPending(id);
            const grouped = groupByOperation<SyncQueueDB>(q);
            
            const {path} = endpoints.forms.updateForm;
            
        } catch (error) {
        } finally {
            setSaving(false);
        }
    };
}

export default UpdateForm;
