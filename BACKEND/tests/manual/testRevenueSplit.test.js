describe("testRevenueSplit conversion", () => {
  const splitRevenue = (amount) => ({
    platform: amount * 0.3,
    teacher: amount * 0.7,
  });

  test("applies 70/30 split correctly", () => {
    const { platform, teacher } = splitRevenue(1000);
    expect(platform).toBe(300);
    expect(teacher).toBe(700);
  });

  test("split totals remain equal to original amount", () => {
    const amount = 3599;
    const { platform, teacher } = splitRevenue(amount);
    expect(platform + teacher).toBeCloseTo(amount, 6);
  });
});
