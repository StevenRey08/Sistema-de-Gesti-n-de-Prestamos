import Sidebar from '../components/layout/Sidebar'
import Topbar from '../components/layout/Topbar'
import MetricCards from '../components/dashboard/MetricCards'
import LoansTable from '../components/dashboard/LoansTable'
import ActivityFeed from '../components/dashboard/ActivityFeed'

function Dashboard() {
    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Topbar />
                <main className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                    <MetricCards />
                    <div className="grid grid-cols-3 gap-6">
                        <div className="col-span-2">
                            <LoansTable />
                        </div>
                        <div>
                            <ActivityFeed />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default Dashboard