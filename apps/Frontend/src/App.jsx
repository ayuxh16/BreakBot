import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import NewScan from "./pages/NewScan";
import FindingsReport from "./pages/FindingsReport";
import Login from "./pages/Login";
import Domains from "./pages/Domains";
import Runs from "./pages/Runs";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/scan/new" element={<NewScan />} />
      <Route path="/report/:runId" element={<FindingsReport />} />
      <Route path="/domains" element={<Domains />} />
      <Route path="/runs" element={<Runs />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
}