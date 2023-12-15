// NO CHANGE THIS FILE EVEN IT HAVING LINT ISSUE
"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function PrelineScript() {
  const path = usePathname();

  useEffect(() => {
    import("preline/preline");
  }, []);

  useEffect(() => {
    setTimeout(() => {
      HSStaticMethods.autoInit();
    }, 100);
  }, [path]);

  return null;
}