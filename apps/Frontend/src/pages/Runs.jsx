import DashboardLayout from "../components/DashboardLayout";

export default function Runs() {
  return (
    <DashboardLayout crumb="BreakBot / Test Runs" title="Test Runs">
      <p className="text-slate-400 text-sm">
        Test execution isn't built yet — this will show live scan progress
        once the crawler and worker are wired up.
      </p>
    </DashboardLayout>
  );
}