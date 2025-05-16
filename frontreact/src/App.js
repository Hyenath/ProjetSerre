import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./login/LoginPage";
import Dashboard from "./dashboard/Dashboard";
import DetailsDash from "./dashboard/DetailsDash";
import SerreInfo from "./dashboard/SerreInfo"; 
import NewUser from "./new-user/New-User";
import UpdateUser from "./adminGest/UpdateUser";
import BasePurge from "./adminGest/BasePurge";
import Regulation from "./Reglage_regulation/Reglage-Regulation";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/details-dashboard" element={<DetailsDash />} />
        <Route path="/new-user" element={<NewUser />} />
        <Route path="/regulation" element={<Regulation />} />
        <Route path="/update-user" element={<UpdateUser />} />
        <Route path="/base-purge" element={<BasePurge />} />
        <Route path="/serre-info" element={<SerreInfo />} />
      </Routes>
    </Router>
  );
};

export default App;