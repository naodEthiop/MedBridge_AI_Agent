import { useState, useCallback } from "react";

export type Reminder = {
  id: string;
  medicine_name: string;
  time: string;
  frequency: "daily" | "twice_daily" | "thrice_daily" | "custom";
  enabled: boolean;
  created_at: string;
};

export function useMedicationReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/medications/reminders");
      const data = (await res.json()) as { ok: boolean; reminders?: Reminder[] };
      if (!data.ok) {
        setError("Failed to load reminders");
        return;
      }
      setReminders(data.reminders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading reminders");
    } finally {
      setLoading(false);
    }
  }, []);

  const createReminder = useCallback(async (medicineName: string, time: string, frequency: Reminder["frequency"]) => {
    setError(null);
    try {
      const res = await fetch("/api/medications/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicineName, time, frequency }),
      });
      const data = (await res.json()) as { ok: boolean; reminder?: Reminder };
      if (!data.ok) {
        setError("Failed to create reminder");
        return false;
      }
      setReminders((prev) => [data.reminder!, ...prev]);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating reminder");
      return false;
    }
  }, []);

  const updateReminder = useCallback(async (id: string, updates: Partial<Omit<Reminder, "id" | "created_at">>) => {
    setError(null);
    try {
      const res = await fetch("/api/medications/reminders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      const data = (await res.json()) as { ok: boolean; reminder?: Reminder };
      if (!data.ok) {
        setError("Failed to update reminder");
        return false;
      }
      setReminders((prev) => prev.map((r) => (r.id === id ? data.reminder! : r)));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating reminder");
      return false;
    }
  }, []);

  const deleteReminder = useCallback(async (id: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/medications/reminders?id=${id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { ok: boolean };
      if (!data.ok) {
        setError("Failed to delete reminder");
        return false;
      }
      setReminders((prev) => prev.filter((r) => r.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting reminder");
      return false;
    }
  }, []);

  const toggleReminder = useCallback(async (id: string, enabled: boolean) => {
    return updateReminder(id, { enabled });
  }, [updateReminder]);

  return {
    reminders,
    loading,
    error,
    fetchReminders,
    createReminder,
    updateReminder,
    deleteReminder,
    toggleReminder,
  };
}
