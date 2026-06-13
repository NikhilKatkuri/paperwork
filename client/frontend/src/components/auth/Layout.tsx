import React from "react";
import Nav from "./client/Nav";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-full h-screen grid grid-cols-1 xl:grid-cols-[1fr_600px] md:bg-brand-light xl:bg-transparent">
      <section className="bg-brand-light h-full w-full max-xl:hidden"></section>
      <section className="p-6 h-full w-full md:px-16 flex flex-col items-center max-w-150 mx-auto md:bg-theme-surface">
        <Nav />
        {children}
      </section>
    </div>
  );
};

export default AuthLayout;
