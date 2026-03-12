import React, { useState } from "react";
import "../components/common/layout.css";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);

  const backend = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) {
      errs.name = "Name is required";
    } else if (form.name.trim().length < 2) {
      errs.name = "Name must be at least 2 characters";
    } else if (form.name.trim().length > 100) {
      errs.name = "Name must be less than 100 characters";
    } else if (!/^[a-zA-Z\s]+$/.test(form.name.trim())) {
      errs.name = "Name can only contain letters and spaces";
    }
    
    if (!form.email.trim()) {
      errs.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Invalid email";
    } else if (form.email.length > 254) {
      errs.email = "Email is too long";
    }
    
    if (!form.message.trim()) {
      errs.message = "Message is required";
    } else if (form.message.trim().length < 10) {
      errs.message = "Message must be at least 10 characters";
    } else if (form.message.trim().length > 2000) {
      errs.message = "Message must be less than 2000 characters";
    }
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    if (!validate()) return;

    try {
      const res = await fetch(`${backend}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus({ ok: true, message: "Thanks — we'll get back to you soon." });
        setForm({ name: "", email: "", message: "" });
        setErrors({});
      } else {
        setStatus({ ok: false, message: data.message || "Submission failed" });
      }
    } catch (err) {
      setStatus({ ok: false, message: "Network error" });
    }
  };

  return (
    <div className="container" style={{ padding: "40px 16px" }}>
      <h2>Contact Us</h2>
      <p>If you have questions or want to collaborate, drop us a message.</p>

      <form className="contact-form" onSubmit={handleSubmit} noValidate>
        <input name="name" type="text" placeholder="Your name" value={form.name} onChange={handleChange} maxLength={100} />
        {errors.name && <small className="error">{errors.name}</small>}

        <input name="email" type="email" placeholder="Your email" value={form.email} onChange={handleChange} maxLength={254} />
        {errors.email && <small className="error">{errors.email}</small>}

        <textarea name="message" placeholder="Message" value={form.message} onChange={handleChange} maxLength={2000} />
        {errors.message && <small className="error">{errors.message}</small>}

        <button type="submit" className="btn primary">Send</button>
        {status && (
          <p className={status.ok ? "success" : "error"} style={{ marginTop: 8 }}>{status.message}</p>
        )}
      </form>
    </div>
  );
};

export default Contact;
