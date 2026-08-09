'use client';

import { cn } from '@/utils/cn';
import LayoutConfig from '../ui/config';
import Navbar from '../client/Navbar';
import SignInContainer from '../client/containers/SignInContainer';
import CheckEmailContainer from '../client/containers/CheckEmailContainer';
import { redirect, useSearchParams } from 'next/navigation';

const renderStep = (step: number) => {
    switch (step) {
        case 1:
            return <CheckEmailContainer />;
        case 2:
            return <SignInContainer />;
        default:
            return <CheckEmailContainer />;
    }
};

const SignInPage = () => {
    const params = useSearchParams();
    const currentStep = params.has('step')
        ? parseInt(params.get('step') as string)
        : 1;
    if (!params.has('email') && currentStep === 2) {
        redirect('/auth/signin?step=1');
    }
    return (
        <div className={cn(LayoutConfig.layout)}>
            <section className={cn(LayoutConfig.leftSection)}></section>
            <section className={cn(LayoutConfig.rightSection)}>
                <Navbar />
                {renderStep(currentStep)}
            </section>
        </div>
    );
};

export default SignInPage;
