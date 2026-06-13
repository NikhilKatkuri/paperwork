"use client";

import { useState } from "react";

const SignUpClientComponent = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="my-3 w-full grid grid-cols-1 space-y-4 md:space-y-6 transition-all ease-in-out duration-150"
    >
      <div>
        <div className="w-full p-3 px-4 rounded-full border outline-0 border-theme-on-surface/20">
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full outline-0"
            placeholder="Email"
          />
        </div>
        {false && <p className="text-xs text-red-500 mt-2 px-3">Error msg</p>}
      </div>
      <div>
        <div className="w-full p-3 px-4 rounded-full border outline-0 border-theme-on-surface/20">
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full outline-0"
            placeholder="Full Name"
          />
        </div>
        {false && <p className="text-xs text-red-500 mt-2 px-3">Error msg</p>}
      </div>
      <div className="">
        <div className="w-full p-3 px-4 rounded-full border outline-0 border-theme-on-surface/20">
          <input
            type="password"
            className="w-full outline-0"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {false && <p className="text-xs text-red-500 mt-2 px-3">Error msg</p>}
      </div>
      <button
        type="submit"
        className="w-full p-3 px-4 active:scale-[0.97] scale-100 rounded-full bg-brand-depth/95 hover:bg-brand-depth transition-all ease-in-out duration-200 cursor-pointer text-on-brand-depth"
      >
        Sign Up
      </button>
    </form>
  );
};

export default SignUpClientComponent;
