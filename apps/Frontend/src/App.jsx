import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import NewScan from "./pages/NewScan";
import FindingsReport from "./pages/FindingsReport";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/scan/new" element={<NewScan />} />
      <Route path="/report/:runId" element={<FindingsReport />} />
    </Routes>
  );
}