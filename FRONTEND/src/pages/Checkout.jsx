import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./checkout.css";

const validateCardNumber = (num) => /^\d{12}$/.test(num);
const validateCvv = (cvv) => /^\d{3}$/.test(cvv);
const validateName = (name) => {
  const trimmed = name.trim();
  if (trimmed.length < 2) return false;
  if (trimmed.length > 100) return false;
  if (!/^[A-Za-z ]+$/.test(trimmed)) return false;
  return true;
};

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const cartItems = (location.state && location.state.cartItems) || [];
  const total = (location.state && location.state.total) || 0;
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  const [cardNumber, setCardNumber] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!validateCardNumber(cardNumber)) newErrors.cardNumber = "Card number must be exactly 12 digits";
    if (!validateCvv(cvv)) newErrors.cvv = "CVV must be exactly 3 digits";
    if (!validateName(name)) {
      if (name.trim().length < 2) {
        newErrors.name = "Name must be at least 2 characters";
      } else if (name.trim().length > 100) {
        newErrors.name = "Name must be less than 100 characters";
      } else {
        newErrors.name = "Name can only contain letters and spaces";
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    // Proceed with checkout (call backend to enroll)
    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      const courseIds = cartItems.map((i) => i.id);

      const response = await fetch(`${backendUrl}/cart/update-enroll-courses`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courseIds }),
      });

      const json = await response.json();
      if (response.ok && json.success) {
          let redirectCourseId = null;
          if (json.data?.enrolledCourses) {
            const enrolledIds = json.data.enrolledCourses
              .map((course) => course?._id || course?.id || course)
              .filter(id => typeof id === 'string' && id.trim().length > 0);
            localStorage.setItem(
              "enrolledCourseIds",
              JSON.stringify(enrolledIds)
            );
            window.dispatchEvent(new Event("enrolledCourseIdsUpdated"));

            // Find the first courseId from the cart that is present in enrolledIds
            const cartCourseIds = courseIds.map(String);
            redirectCourseId = cartCourseIds.find(id => enrolledIds.includes(id));
          }

          if (redirectCourseId) {
            navigate(`/student/courses/${redirectCourseId}`);
          } else if (courseIds.length > 0) {
            // Optimistically redirect to the first course in the cart
            navigate(`/student/courses/${courseIds[0]}`);
          } else {
            navigate("/student");
          }
      } else {
        setErrors({ form: json.message || "Checkout failed" });
      }
    } catch (err) {
      setErrors({ form: "Network error during checkout" });
      console.error("Checkout error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="checkout-container">
      <h2>Checkout</h2>
      <div className="checkout-grid">
        <div className="checkout-form">
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label>Card Number</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={12}
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="123412341234"
              />
              {errors.cardNumber && <div className="error">{errors.cardNumber}</div>}
            </div>

            <div className="form-row">
              <div className="form-group small">
                <label>CVV</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={3}
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="123"
                />
                {errors.cvv && <div className="error">{errors.cvv}</div>}
              </div>

              <div className="form-group flex">
                <label>Name on Card</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.replace(/[^A-Za-z ]/g, ""))}
                  placeholder="John Doe"
                  maxLength={100}
                />
                {errors.name && <div className="error">{errors.name}</div>}
              </div>
            </div>

            {errors.form && <div className="error form-error">{errors.form}</div>}

            <button className="btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Processing..." : `Pay ₹${total}`}
            </button>
          </form>
        </div>

        <aside className="checkout-summary">
          <h3>Order Summary</h3>
          <div className="summary-list">
            {cartItems.length === 0 ? <p>No items in cart</p> : cartItems.map((c) => (
              <div key={c.id} className="summary-item">
                <span>{c.title}</span>
                <strong>₹{c.price}</strong>
              </div>
            ))}
          </div>
          <div className="summary-total">Total: <strong>₹{total}</strong></div>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;
