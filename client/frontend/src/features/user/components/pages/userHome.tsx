 import UserHeader from "../ui/UserHeader";
import UserTemplateList from "../ui/UserTemplateList";

function UserHome() {
  return (
    <main className="h-full w-full max-w-7xl mx-auto px-5">
      <UserHeader/>
      <UserTemplateList/>
    </main>
  );
}

export default UserHome;
