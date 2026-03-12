// Cart operations
export const addToCart = (course) => {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  
  // Check if course is already in cart
  if (!cart.some(item => item.id === course.id)) {
    cart.push({
      id: course.id,
      title: course.title,
      price: course.price,
      instructor: course.instructor,
      thumbnail: course.thumbnail
    });
    localStorage.setItem('cart', JSON.stringify(cart));
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event('cartUpdated'));
    return true;
  }
  return false;
};

export const removeFromCart = (courseId) => {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const updatedCart = cart.filter(item => item.id !== courseId);
  localStorage.setItem('cart', JSON.stringify(updatedCart));
  // Dispatch custom event for same-tab updates
  window.dispatchEvent(new Event('cartUpdated'));
};

export const getCartItems = () => {
  return JSON.parse(localStorage.getItem('cart') || '[]');
};

export const getCartTotal = () => {
  const cart = getCartItems();
  return cart.reduce((total, item) => total + item.price, 0);
};