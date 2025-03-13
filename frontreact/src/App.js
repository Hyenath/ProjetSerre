import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./login/LoginPage";
import Dashboard from "./dashboard/Dashboard";
import NewUser from "./new-user/New-User";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/new-user" element={<NewUser />} />
      </Routes>
    </Router>
  );
};

export default App;