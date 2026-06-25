import { useState, useCallback, useEffect } from "react";
import * as groupsApi from "../api/groups";
import * as expensesApi from "../api/expenses";

const GROUP_ID_STORAGE_KEY = "splitwise-lite:groupId";

/**
 * Owns the full lifecycle of a single group: creating it (or restoring it
 * from a previous session), loading expenses, adding new ones, and pulling
 * the minimized settlement after every change.
 */
export function useGroup() {
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [settlement, setSettlement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshSettlement = useCallback(async (groupId) => {
    const data = await expensesApi.getSettlement(groupId);
    setSettlement(data);
  }, []);

  const refreshExpenses = useCallback(async (groupId) => {
    const data = await expensesApi.listExpenses(groupId);
    setExpenses(data);
  }, []);

  // On mount, restore a previously created group from localStorage if it
  // still exists on the backend; otherwise fall through to "no group yet".
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const savedId = localStorage.getItem(GROUP_ID_STORAGE_KEY);
      if (!savedId) {
        setLoading(false);
        return;
      }
      try {
        const existing = await groupsApi.getGroup(savedId);
        if (cancelled) return;
        setGroup(existing);
        await Promise.all([refreshExpenses(existing.id), refreshSettlement(existing.id)]);
      } catch {
        localStorage.removeItem(GROUP_ID_STORAGE_KEY);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [refreshExpenses, refreshSettlement]);

  const startGroup = useCallback(async (name, members) => {
    setError(null);
    const created = await groupsApi.createGroup(name, members);
    localStorage.setItem(GROUP_ID_STORAGE_KEY, created.id);
    setGroup(created);
    setExpenses([]);
    setSettlement(null);
    return created;
  }, []);

  const submitExpense = useCallback(
    async (payload) => {
      if (!group) return;
      setError(null);
      await expensesApi.addExpense(group.id, payload);
      await Promise.all([refreshExpenses(group.id), refreshSettlement(group.id)]);
    },
    [group, refreshExpenses, refreshSettlement]
  );

  const removeExpense = useCallback(
    async (expenseId) => {
      if (!group) return;
      setError(null);
      await expensesApi.deleteExpense(group.id, expenseId);
      await Promise.all([refreshExpenses(group.id), refreshSettlement(group.id)]);
    },
    [group, refreshExpenses, refreshSettlement]
  );

  const endGroup = useCallback(async () => {
    if (!group) return;
    await groupsApi.deleteGroup(group.id);
    localStorage.removeItem(GROUP_ID_STORAGE_KEY);
    setGroup(null);
    setExpenses([]);
    setSettlement(null);
  }, [group]);

  return {
    group,
    expenses,
    settlement,
    loading,
    error,
    setError,
    startGroup,
    submitExpense,
    removeExpense,
    endGroup,
  };
}
