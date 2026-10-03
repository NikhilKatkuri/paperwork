import Sidebar from '../sidebar';

function Dashboard({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <div
            className={
                'relative h-screen w-screen gap-3 min-[44rem]:grid min-[44rem]:grid-cols-[96px_1fr]'
            }
        >
            <Sidebar />
            {children}
        </div>
    );
}

export default Dashboard;
