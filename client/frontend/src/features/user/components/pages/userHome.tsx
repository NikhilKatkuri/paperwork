 import UserForms from "../ui/UserForms";
import UserHeader from "../ui/UserHeader";
import UserTemplateList from "../ui/UserTemplateList";

function UserHome() {
  return (
    <main className="h-full w-full max-w-7xl mx-auto px-2 min-[44rem]:px-5 overflow-y-auto scrollbar-none">
      <UserHeader/>
      <UserTemplateList/>
      <UserForms/>
    </main>
  );
}

export default UserHome;
