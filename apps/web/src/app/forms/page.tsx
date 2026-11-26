import Dashboard from '@/features/user/components/layouts/Dashboard';
import UserHome from '@/features/user/components/pages/userHome';

/** `/forms` is the canonical entry for the user's forms dashboard. */
const Page = () => {
    return (
        <Dashboard>
            <UserHome />
        </Dashboard>
    );
};

export default Page;
