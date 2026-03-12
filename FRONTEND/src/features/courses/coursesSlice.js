import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

export const fetchCourses = createAsyncThunk(
  "courses/fetchcourses",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/courses");

      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const coursesSlice = createSlice({
  name: "courses",
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {
    updateCourseLocal(state, action) {
      const index = state.list.findIndex((l) => l.id === action.payload.id);
      state.list[index] = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default coursesSlice.reducer;
