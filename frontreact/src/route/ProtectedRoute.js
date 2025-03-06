import React from "react";
import { Route, Navigate } from "react-router-dom";

const ProtectedRoute = ({ component: Component, ...rest }) => {
  const token = localStorage.getItem("token");
  console.log("ProtectedRoute vérifié - Token :", token);

  return (
    <Route
      {...rest}
      element={token ? <Component /> : <Navigate to="/authentication/sign-in" />}
    />
  );
};

export default ProtectedRoute;
