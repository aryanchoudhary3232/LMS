import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";

export const fetchCart = createAsyncThunk(
  "cart/fetch",
  async (calculateTotal, { rejectWithValue }) => {
    try {
      console.log("..........");

      const response = await api.get("/cart");
      console.log("Cart Response:", response.data);

      const cartData = response.data?.data || response.data;
      const rawItems = cartData?.items || [];

      const items = rawItems
        .filter((item) => item && item.course) // 🛡️ Skip items with null course references
        .map((i) => ({
          id: i.course._id || i._id,
          title: i.course.title || "Unknown Course",
          instructor: i.course.description || "",
          price: i.course.price || 0,
          thumbnail: i.course.image || "",
        }));

      if (calculateTotal && typeof calculateTotal === "function") {
        calculateTotal(items);
      }

      return items;
    } catch (error) {
      console.error("Fetch Cart Error:", error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const removeFromCart = createAsyncThunk(
  "cart/remove",
  async (courseId, { rejectWithValue }) => {
    try {
      await api.delete(`/cart/remove/${courseId}`);
      return courseId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addToCart = createAsyncThunk(
  "cart/add",
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/cart/add/${courseId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.items = action.payload || [];  // ✅ Fallback to empty array
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(removeFromCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload);
        state.loading = false;
        state.error = null;
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Optimization: We could update items here if the payload was mapped,
        // but typically a fetchCart is triggered or navigation occurs.
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default cartSlice.reducer;
