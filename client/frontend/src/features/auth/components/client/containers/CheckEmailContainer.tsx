'use client';
import CheckEmailClientComponent from '@/auth/components/client/CheckEmailComponent';
import Image from 'next/image';
import Link from 'next/link';
import { INTENT_EMAIL_CONFIG } from '@/auth/constants/data';
import { usePathname } from 'next/navigation';
import getIntentFromPathname from '../../utils/lookups';

function CheckEmailContainer() {
    const pn = usePathname();
    const intent = getIntentFromPathname(pn);
    const data = INTENT_EMAIL_CONFIG[intent];

    return (
        <div className="flex h-full w-full flex-col justify-center space-y-5">
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
                    {data.title}
                </h1>
                <p className="text-md md:text-lg">{data.subtitle}</p>
            </div>
            <CheckEmailClientComponent />
            <footer className="my-3 grid w-full grid-cols-1 space-y-3 select-none">
                <p className="text-center text-xs">
                    {data.footerText}{' '}
                    <Link
                        href={data.footerTarget}
                        className="text-brand-depth font-medium hover:underline"
                    >
                        {data.footerLinkText}
                    </Link>
                </p>
                {intent === 'signIn' && (
                    <p className="text-center text-xs">
                        Forgot your password?{' '}
                        <Link
                            href="/auth/forgot-password"
                            className="text-brand-depth font-medium hover:underline"
                        >
                            Reset it here
                        </Link>
                    </p>
                )}
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
}

export default CheckEmailContainer;
