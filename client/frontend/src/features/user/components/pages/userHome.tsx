import UserForms from '../../../common/ui/UserForms';
import UserHeader from '../ui/UserHeader';
import UserTemplateList from '../ui/UserTemplateList';

function UserHome() {
    return (
        <main className="mx-auto h-full w-full max-w-7xl scrollbar-none overflow-y-auto px-2 min-[44rem]:px-5">
            <UserHeader />
            <UserTemplateList />
            <UserForms />
        </main>
    );
}

export default UserHome;
