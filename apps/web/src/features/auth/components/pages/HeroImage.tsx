import React from 'react';
import LayoutConfig from '../ui/config';
import { cn } from '@/utils/cn';
import Image from 'next/image';

export default function HeroImage() {
    return (
        <section className={cn(LayoutConfig.leftSection)}>
            <Image
                src="/beautiful-natural-landscape.jpg"
                alt="Sign Up"
                fill
                priority // Recommended for large hero/auth background images for fast LCP loading
                className="object-cover"
            />
        </section>
    );
}
