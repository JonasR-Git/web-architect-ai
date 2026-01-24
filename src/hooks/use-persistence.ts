
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import {
    saveSessionAction,
    loadSessionAction,
    listSessionsAction,
    deleteSessionAction
} from '@/app/actions';
import { SessionData, SessionSummary } from '@/modules/core/persistence';

export function usePersistence() {
    const [sessions, setSessions] = useState<SessionSummary[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Load list on mount
    useEffect(() => {
        refreshSessions();
    }, []);

    const refreshSessions = async () => {
        const result = await listSessionsAction();
        if (result.success && result.data) {
            setSessions(result.data);
        }
    };

    const saveSession = useCallback(async (data: Omit<SessionData, 'lastModified'>): Promise<SessionData | null> => {
        if (!data.id) return null; // Can't save without ID

        setIsSaving(true);
        const payload: SessionData = {
            ...data,
            lastModified: Date.now()
        } as SessionData;

        const result = await saveSessionAction(payload);
        setIsSaving(false);

        if (result.success && result.data) {
            setLastSaved(new Date());
            // No toast for auto-save to keep it quiet, but success is tracked
            refreshSessions(); // Update list to show new timestamp
            return result.data;
        } else {
            toast.error('Save Failed', { description: result.error });
            return null;
        }
    }, []);

    const loadSession = useCallback(async (id: string): Promise<SessionData | null> => {
        setIsLoading(true);
        const result = await loadSessionAction(id);
        setIsLoading(false);

        if (result.success && result.data) {
            setCurrentSessionId(id);
            setLastSaved(new Date(result.data.lastModified));
            toast.success('Session Loaded');
            return result.data;
        } else {
            toast.error('Load Failed', { description: result.error });
            return null;
        }
    }, []);

    const deleteSession = useCallback(async (id: string) => {
        const result = await deleteSessionAction(id);
        if (result.success) {
            toast.success('Session Deleted');
            if (currentSessionId === id) setCurrentSessionId(null);
            refreshSessions();
        } else {
            toast.error('Delete Failed', { description: result.error });
        }
    }, [currentSessionId]);

    return {
        sessions,
        currentSessionId,
        lastSaved,
        isSaving,
        isLoading,
        saveSession,
        loadSession,
        deleteSession,
        refreshSessions
    };
}
