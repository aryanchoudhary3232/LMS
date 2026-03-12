import { useContext } from "react";
import SuperAdminContext from "./super-admin-context";

export const useSuperAdmin = () => {
  const context = useContext(SuperAdminContext);

  if (!context) {
    throw new Error("useSuperAdmin must be used within SuperAdminProvider");
  }

  return context;
};
