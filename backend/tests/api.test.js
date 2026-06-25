const request = require("supertest");
const createApp = require("../src/app");

const app = createApp();

describe("Splitwise-Lite API", () => {
  let groupId;

  test("POST /api/groups creates a group", async () => {
    const res = await request(app)
      .post("/api/groups")
      .send({ name: "Roomies", members: ["Amit", "Rahul", "Sneha"] });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Roomies");
    expect(res.body.members).toEqual(["Amit", "Rahul", "Sneha"]);
    groupId = res.body.id;
  });

  test("POST /api/groups rejects fewer than 2 members", async () => {
    const res = await request(app)
      .post("/api/groups")
      .send({ name: "Solo", members: ["Amit"] });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid group payload/);
  });

  test("POST /api/groups/:groupId/expenses adds an expense with valid splits", async () => {
    const res = await request(app)
      .post(`/api/groups/${groupId}/expenses`)
      .send({
        description: "Dinner",
        amount: 300,
        payer: "Amit",
        splits: { Amit: 50, Rahul: 25, Sneha: 25 },
      });

    expect(res.status).toBe(201);
    expect(res.body.description).toBe("Dinner");
  });

  test("POST expense rejects splits that don't total 100%", async () => {
    const res = await request(app)
      .post(`/api/groups/${groupId}/expenses`)
      .send({
        description: "Snacks",
        amount: 50,
        payer: "Rahul",
        splits: { Amit: 30, Rahul: 30, Sneha: 30 },
      });

    expect(res.status).toBe(400);
    expect(res.body.details.some((d) => d.includes("100%"))).toBe(true);
  });

  test("POST expense rejects an unknown payer", async () => {
    const res = await request(app)
      .post(`/api/groups/${groupId}/expenses`)
      .send({
        description: "Snacks",
        amount: 50,
        payer: "NotInGroup",
        splits: { Amit: 34, Rahul: 33, Sneha: 33 },
      });

    expect(res.status).toBe(400);
  });

  test("GET /api/groups/:groupId/settlement returns minimized settlement sentences", async () => {
    const res = await request(app).get(`/api/groups/${groupId}/settlement`);

    expect(res.status).toBe(200);
    expect(res.body.sentences.length).toBeGreaterThan(0);
    expect(res.body.sentences.some((s) => s.includes("owes"))).toBe(true);
  });

  test("GET settlement for unknown group returns 404", async () => {
    const res = await request(app).get("/api/groups/does-not-exist/settlement");
    expect(res.status).toBe(404);
  });

  test("DELETE /api/groups/:groupId removes the group", async () => {
    const res = await request(app).delete(`/api/groups/${groupId}`);
    expect(res.status).toBe(204);

    const followUp = await request(app).get(`/api/groups/${groupId}`);
    expect(followUp.status).toBe(404);
  });
});
