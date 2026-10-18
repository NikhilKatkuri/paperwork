import { cn } from '@/utils/cn';
import LayoutConfig from '../ui/config';
import Navbar from '../client/Navbar';
import CheckEmailContainer from '../client/containers/CheckEmailContainer';
import HeroImage from './HeroImage';

const ForgotPasswordPage = () => {
    return (
        <div className={cn(LayoutConfig.layout)}>
            <HeroImage />

            <section className={cn(LayoutConfig.rightSection)}>
                <Navbar />
                <CheckEmailContainer />
            </section>
        </div>
    );
};

export default ForgotPasswordPage;
