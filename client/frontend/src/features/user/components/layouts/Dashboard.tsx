import Sidebar from "../sidebar";

function Dashboard({ children }: { children: React.ReactNode }) {
  return (
    <div className={"w-screen h-screen relative gap-3 min-[44rem]:grid min-[44rem]:grid-cols-[96px_1fr]"}>
     <Sidebar/>
      {children}
    </div>
  );
}

export default Dashboard;
