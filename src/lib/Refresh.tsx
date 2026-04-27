"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const Refresh = () => {
  const router = useRouter();
  const pathname = usePathname();
  const initialPathname = useRef(pathname);

  useEffect(() => {
    if (initialPathname.current === pathname) return;
    router.refresh();
  }, [router, pathname]);

  return null;
};

export default Refresh;