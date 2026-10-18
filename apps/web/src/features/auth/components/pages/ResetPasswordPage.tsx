import { cn } from '@/utils/cn';
import LayoutConfig from '../ui/config';
import ResetPasswordContainer from '../client/containers/ResetPasswordContainer';
import HeroImage from './HeroImage';

const ResetPasswordPage = () => {
    return (
        <div className={cn(LayoutConfig.layout)}>
            <HeroImage />

            <section className={cn(LayoutConfig.rightSection)}>
                <ResetPasswordContainer />
            </section>
        </div>
    );
};

export default ResetPasswordPage;
