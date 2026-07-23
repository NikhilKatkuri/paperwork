import Dashboard from "@/features/user/components/layouts/Dashboard";
import EditProfile from "@/features/user/components/pages/edit-profile";

const page = () => {
  return (
    <Dashboard>
      <EditProfile />
    </Dashboard>
  );
};

export default page;
