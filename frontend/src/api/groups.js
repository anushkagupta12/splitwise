import client from "./client";

export async function createGroup(name, members) {
  const { data } = await client.post("/groups", { name, members });
  return data;
}

export async function listGroups() {
  const { data } = await client.get("/groups");
  return data;
}

export async function getGroup(groupId) {
  const { data } = await client.get(`/groups/${groupId}`);
  return data;
}

export async function deleteGroup(groupId) {
  await client.delete(`/groups/${groupId}`);
}
