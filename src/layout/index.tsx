import React, { PropsWithChildren } from "react";
import Footer from "../Footer";
import logoPath from "../assets/logo.png";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative px-4 pt-6 pb-4">
      <div className="flex items-center pl-4">
        <img src={logoPath} alt="logo" className="h-8" />
        <div className="font-montserrat ml-2 text-lg">Mark2Thread</div>
      </div>
      {children}
      <Footer />
    </div>
  );
}
