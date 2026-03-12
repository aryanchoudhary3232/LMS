import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";

export const fetchProfile = createAsyncThunk(
  "studentProfile/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/auth/profile");
      return response.data.data;
    } catch (error) {
      rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateProfile = createAsyncThunk("studentProfile/update", async(_, {rejectWithValue}) => {
    try {
        const response = await api.put('/auth/profile')
        return response.data.data
    } catch (error) {
        rejectWithValue(error.response?.data?.message || error.message)
    }
})

const studentProfileSlice = createSlice({
  name: "studentProfile",
  initialState: {
    name: "",
    email: "",
    role: "",
    loading: false,
    error: null,
  },
  reducers: {
    updateStudentProfile(state, action) {
      state.name = action.payload.name;
      state.email = action.payload.email;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.name = action.payload.name;
        state.email = action.payload.email;
        state.role = action.payload.role
        state.loading = false;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateProfile.pending, (state) => {
        state.loading = true
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.name = action.payload.name
      })
  },
});

export default studentProfileSlice.reducer;
