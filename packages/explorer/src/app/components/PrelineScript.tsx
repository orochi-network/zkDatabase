"use client";
import { useEffect } from "react";

export default function PrelineScript() {

  useEffect(() => {
    import("preline/preline");
  }, []);

  return null;
}