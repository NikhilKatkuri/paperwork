import Image from 'next/image';

const page = () => {
    return (
        <div className="flex flex-col h-full w-full items-center justify-center p-4">
            <Image
                src="/illustration/settings_hero.svg"
                alt="Settings"
                width={1024}
                height={1024}
                className="aspect-square h-64 xl:h-86"
            />
            <p className="text-md text-center my-3   font-medium text-gray-700">
                Customize, manage, and control your account settings.
            </p>
        </div>
    );
};

export default page;
