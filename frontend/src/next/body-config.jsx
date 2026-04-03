"use client";

import { useEffect } from "react";

export function BodyConfig({ className = "", rolePage = "" }) {
  useEffect(() => {
    const previousClass = document.body.className;
    const previousRole = document.body.dataset.rolePage || "";

    document.body.className = className;

    if (rolePage) {
      document.body.dataset.rolePage = rolePage;
    } else {
      delete document.body.dataset.rolePage;
    }

    return () => {
      document.body.className = previousClass;

      if (previousRole) {
        document.body.dataset.rolePage = previousRole;
      } else {
        delete document.body.dataset.rolePage;
      }
    };
  }, [className, rolePage]);

  return null;
}
