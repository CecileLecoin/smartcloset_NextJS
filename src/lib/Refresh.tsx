"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const Refresh = () => {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Only on root "/"
    if (pathname !== "/") return;

    // Check if refresh already happened
    const hasRefreshed = sessionStorage.getItem("root-refreshed");
    if (hasRefreshed) return;

    // Mark as refreshed and refresh
    sessionStorage.setItem("root-refreshed", "true");
    router.refresh();
  }, [pathname, router]);

  return null;
};

export default Refresh;






/*"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const Refresh = () => {
  const router = useRouter();
  const pathname = usePathname();
  const initialPathname = useRef(pathname);

  useEffect(() => {
    
    
      // Force a full page refresh by navigating to the current pathname
    if (initialPathname.current === pathname) return;
      router.refresh();
    
    if (!pathname) return;
      router.refresh(); 

  }, [router, pathname]);

  return null;
};

export default Refresh;*/