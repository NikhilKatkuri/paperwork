"use client";

import { useRef } from "react";

const EditProfilePage = () => {
  const fullNameRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex h-full flex-col ">
      <div className="flex-1 flex-col gap-6 p-4 px-6 text-theme-on-surface w-full  xl:pl-24 h-full">
        <h1 className="text-2xl font-bold my-2">Edit Profile</h1>
        <p className="">
          Keep your personal details private.
          <br /> Information you add here is visible to anyone who can view your
          profile.
        </p>
        <div className="grid grid-cols-1 space-y-4 max-w-xl mt-12">
          <div className="">
            <h1 className="text-sm text-theme-on-surface/60">Photo</h1>
            <div className="flex gap-6 items-center mt-5">
              <div className="h-24 w-24 bg-theme-surface border border-theme-on-surface/30 rounded-full"></div>
              <button className="text-sm font-semibold p-2.5 px-4 rounded-xl bg-theme-grey-lg hover:bg-brand-depth hover:text-on-brand-depth cursor-pointer ease-in-out duration-200 text-surface  transition-all">
                Change
              </button>
            </div>
          </div>
          <label
            htmlFor="fullName"
            className="border rounded-xl p-3 border-theme-on-surface/40 active:border-brand-depth/90 focus-within:border-brand-depth/90 focus-within:ring-2 focus-within:ring-brand-depth/50 transition-all ease-in-out duration-200 "
          >
            <h1 className="text-xs text-theme-on-surface/60">Full Name</h1>
            <input
              type="text"
              id="fullName"
              className="w-full py-1.5 bg-transparent border-none focus:outline-none text-base font-medium text-theme-on-surface"
              ref={fullNameRef}
            />
          </label>
          <label
            htmlFor="Bio"
            className="border rounded-xl p-3 border-theme-on-surface/40 active:border-brand-depth/90 focus-within:border-brand-depth/90 focus-within:ring-2 focus-within:ring-brand-depth/50 transition-all ease-in-out duration-200 "
          >
            <h1 className="text-xs text-theme-on-surface/60">Bio</h1>
            <textarea
              id="Bio"
              className="w-full min-h-8  resize-none py-1.5 bg-transparent border-none focus:outline-none text-base font-medium text-theme-on-surface"
            />
          </label>
        </div>
      </div>
      <div className="lg:h-24 w-full bg-theme-surface border-t border-theme-on-surface/10"></div>
    </div>
  );
};

export default EditProfilePage;
