import React, { useState, useEffect } from "react";
import "../../css/student/Cart.css";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchCart, removeFromCart } from "../../features/cart/cartSlice";
import { setAuthToken } from "../../api/axios";
import { useAuth } from "../../contexts/AuthContext";

const Cart = () => {
  // const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  // const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  const dispatch = useDispatch();
  const { token } = useAuth();
  useEffect(() => {
    setAuthToken(token);
    if (token) dispatch(fetchCart(calculateTotal));
  }, [dispatch, token]);

  const cartItems = useSelector((state) => state.cart.items) || [];  // Fallback to empty array
  const loading = useSelector((state) => state.cart.loading);

  // Recalculate total whenever cart items change
  useEffect(() => {
    calculateTotal(cartItems);
  }, [cartItems]);

  const calculateTotal = (items) => {
    const sum = items.reduce((acc, item) => acc + (item.price || 0), 0);
    setTotal(sum);
  };

  const handleRemoveFromCart = async (courseId) => {
    try {
      await dispatch(removeFromCart(courseId)).unwrap();
      // Dispatch event to update navbar
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      console.error("Error removing course:", err);
    }
  };

  const handleCheckout = async () => {
    // Navigate to the checkout page and pass cart data via location state
    navigate("/checkout", { state: { cartItems, total } });
  };

  if (loading) return <div className="cart-container">Loading...</div>;

  return (
    <div className="cart-container">
      <h2>Your Cart</h2>
      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <p>Your cart is empty</p>
          <button
            onClick={() => (window.location.href = "/courses")}
            className="browse-courses-btn"
          >
            Browse Courses
          </button>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cartItems.map((item) => (
              <div key={item.id} className="cart-item">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="course-thumbnail"
                />
                <div className="item-details">
                  <h3>{item.title}</h3>
                  <p>{item.instructor}</p>
                  <p className="price">₹{item.price}</p>
                </div>
                <button
                  onClick={() => handleRemoveFromCart(item.id)}
                  className="remove-btn"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Total Items:</span>
              <span>{cartItems.length}</span>
            </div>
            <div className="summary-row">
              <span>Total Amount:</span>
              <span>₹{total}</span>
            </div>
            <button className="checkout-btn" onClick={handleCheckout}>
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
