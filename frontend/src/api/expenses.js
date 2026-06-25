import client from "./client";

export async function addExpense(groupId, { description, amount, payer, splits }) {
  const { data } = await client.post(`/groups/${groupId}/expenses`, {
    description,
    amount,
    payer,
    splits,
  });
  return data;
}

export async function listExpenses(groupId) {
  const { data } = await client.get(`/groups/${groupId}/expenses`);
  return data;
}

export async function deleteExpense(groupId, expenseId) {
  await client.delete(`/groups/${groupId}/expenses/${expenseId}`);
}

export async function getSettlement(groupId) {
  const { data } = await client.get(`/groups/${groupId}/settlement`);
  return data;
}
