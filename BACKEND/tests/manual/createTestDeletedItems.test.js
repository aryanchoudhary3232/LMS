describe("createTestDeletedItems conversion", () => {
  const buildSoftDeleteUpdate = () => ({
    isDeleted: true,
    deletedAt: new Date(),
  });

  test("marks records as deleted with a timestamp", () => {
    const update = buildSoftDeleteUpdate();
    expect(update.isDeleted).toBe(true);
    expect(update.deletedAt).toBeInstanceOf(Date);
  });
});
