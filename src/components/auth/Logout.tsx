import React from "react";
import { useAuth } from "./AuthContext";

export default function Logout() {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <button onClick={handleLogout}>
      Logout
    </button>
  );
}