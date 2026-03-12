(async () => {
  try {
    const res = await fetch("http://localhost:3000/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Admin User",
        email: "admin@example.com",
        password: "admin123",
        role: "Admin",
      }),
    });
    const data = await res.json();
    console.log("register response:", data);
  } catch (err) {
    console.error("error:", err);
  }
})();
