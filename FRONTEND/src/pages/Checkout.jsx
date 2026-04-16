import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./checkout.css";

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

const loadRazorpayScript = () =>
  new Promise((resolve, reject) => {
    if (globalThis.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(
      `script[src="${RAZORPAY_SCRIPT_URL}"]`
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true));
      existingScript.addEventListener("error", () =>
        reject(new Error("Failed to load Razorpay SDK"))
      );
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.body.appendChild(script);
  });

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const cartItems = (location.state && location.state.cartItems) || [];
  const total = (location.state && location.state.total) || 0;
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  const [errors, setErrors] = useState({ form: "" });
  const [submitting, setSubmitting] = useState(false);
  const [razorpayReady, setRazorpayReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    loadRazorpayScript()
      .then(() => {
        if (mounted) {
          setRazorpayReady(true);
        }
      })
      .catch((error) => {
        console.error("Razorpay script load error:", error);
        if (mounted) {
          setErrors({ form: "Unable to load Razorpay checkout. Please refresh." });
          setRazorpayReady(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleSuccessfulEnrollment = (responseJson, courseIds) => {
    let redirectCourseId = null;

    if (responseJson?.data?.enrolledCourses) {
      const enrolledIds = responseJson.data.enrolledCourses
        .map((course) => course?._id || course?.id || course)
        .filter((id) => typeof id === "string" && id.trim().length > 0);

      localStorage.setItem("enrolledCourseIds", JSON.stringify(enrolledIds));
      window.dispatchEvent(new Event("enrolledCourseIdsUpdated"));
      window.dispatchEvent(new Event("cartUpdated"));

      const cartCourseIds = courseIds.map(String);
      redirectCourseId = cartCourseIds.find((id) => enrolledIds.includes(id));
    }

    if (redirectCourseId) {
      navigate(`/student/courses/${redirectCourseId}`);
    } else if (courseIds.length > 0) {
      navigate(`/student/courses/${courseIds[0]}`);
    } else {
      navigate("/student");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({ form: "" });

    const token = localStorage.getItem("token");
    if (!token) {
      setErrors({ form: "Please login to continue" });
      return;
    }

    const courseIds = cartItems.map((i) => String(i.id)).filter(Boolean);
    if (courseIds.length === 0) {
      setErrors({ form: "No items found in checkout" });
      return;
    }

    if (!razorpayReady || !globalThis.Razorpay) {
      setErrors({ form: "Razorpay is still loading. Please try again." });
      return;
    }

    try {
      setSubmitting(true);

      const orderResponse = await fetch(`${backendUrl}/cart/create-payment-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courseIds }),
      });

      const orderJson = await orderResponse.json();

      if (!orderResponse.ok || !orderJson.success) {
        setErrors({ form: orderJson.message || "Unable to initiate payment" });
        setSubmitting(false);
        return;
      }

      if (!orderJson?.data?.orderId) {
        setErrors({ form: orderJson.message || "Payment order was not created" });
        setSubmitting(false);
        return;
      }

      const options = {
        key: orderJson.data.keyId,
        amount: orderJson.data.amount,
        currency: orderJson.data.currency || "INR",
        name: "SeekhoBharat",
        description: `Checkout for ${courseIds.length} course(s)`,
        order_id: orderJson.data.orderId,
        theme: {
          color: "#2839a8",
        },
        handler: async (paymentResponse) => {
          try {
            const verifyResponse = await fetch(`${backendUrl}/cart/verify-payment`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                courseIds,
                razorpayOrderId: paymentResponse.razorpay_order_id,
                razorpayPaymentId: paymentResponse.razorpay_payment_id,
                razorpaySignature: paymentResponse.razorpay_signature,
              }),
            });

            const verifyJson = await verifyResponse.json();

            if (!verifyResponse.ok || !verifyJson.success) {
              setErrors({ form: verifyJson.message || "Payment verification failed" });
              setSubmitting(false);
              return;
            }

            handleSuccessfulEnrollment(verifyJson, courseIds);
          } catch (verifyError) {
            console.error("Payment verification error:", verifyError);
            setErrors({ form: "Unable to verify payment. Contact support if amount is deducted." });
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
          },
        },
      };

      const razorpayInstance = new globalThis.Razorpay(options);
      razorpayInstance.on("payment.failed", (paymentError) => {
        const reason =
          paymentError?.error?.description || paymentError?.error?.reason || "Payment failed";
        setErrors({ form: reason });
        setSubmitting(false);
      });

      razorpayInstance.open();
    } catch (err) {
      setErrors({ form: "Network error during checkout" });
      console.error("Checkout error:", err);
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
              <label>Secure Payment</label>
              <p style={{ margin: "10px 0 0", color: "#5b6170" }}>
                Click the button below to continue with Razorpay Checkout.
              </p>
            </div>

            {errors.form && <div className="error form-error">{errors.form}</div>}

            <button className="btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Opening Razorpay..." : `Pay ₹${total} with Razorpay`}
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
