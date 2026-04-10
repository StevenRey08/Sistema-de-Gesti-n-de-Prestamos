import MetricCards from '../src/components/dashboard/MetricCards';
import LoansTable from '../src/components/dashboard/LoansTable';
import ActivityFeed from '../src/components/dashboard/ActivityFeed';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Resumen general del sistema</p>
      </div>
      <MetricCards />
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <LoansTable />
        </div>
        <div>
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
