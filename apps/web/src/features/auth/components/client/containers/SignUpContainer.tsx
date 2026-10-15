import Image from 'next/image';
import SignUpClientComponent from '../SignUpComponent';
import Link from 'next/link';

const SignUpContainer = () => {
    return (
        <div className="flex h-full w-full flex-col items-center justify-center space-y-5">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <Image
                        src="/paperwork_icon-vector-master.svg"
                        alt="paperwork-icon-vector-master"
                        width={32}
                        height={32}
                        className=""
                    />
                    <p className="my-3 text-lg font-medium">Paper Work</p>
                </div>
                <h1 className="text-xl font-semibold md:text-2xl md:font-medium">
                    Build your first form
                </h1>
                <p className="text-md md:text-lg">
                    Sign up to unlock logic-driven questions, real-time response
                    analytics, and gorgeous templates.
                </p>
            </div>
            <SignUpClientComponent />
            <footer className="my-3 grid w-full grid-cols-1 space-y-3">
                <div className="flex w-full items-center justify-center gap-3 text-center text-xs">
                    <Link
                        href={''}
                        className="hover:underline active:underline"
                    >
                        Terms of Use
                    </Link>
                    <Link
                        href={''}
                        className="hover:underline active:underline"
                    >
                        Privacy Policy
                    </Link>
                </div>
            </footer>
        </div>
    );
};

export default SignUpContainer;
