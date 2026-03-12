import { configureStore } from "@reduxjs/toolkit";
import coursesReducer from "../features/courses/coursesSlice";
import studentProfileReducer from "../features/studentProfile/studentProfileSlice";
import cartReducer from "../features/cart/cartSlice";

const store = configureStore({
  reducer: {
    courses: coursesReducer,
    studentProfile: studentProfileReducer,
    cart: cartReducer,
  },
});

export default store;
