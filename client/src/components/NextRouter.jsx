"use client";

import NextLink from "next/link";
import {
  useParams as useNextParams,
  usePathname,
  useRouter,
} from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";

export function Link({ to, href, ...props }) {
  return <NextLink href={href ?? to} {...props} />;
}

export function NavLink({ className, end = false, to, ...props }) {
  const pathname = usePathname();
  const isActive = end
    ? pathname === to
    : to === "/"
      ? pathname === "/"
      : pathname === to || pathname.startsWith(`${to}/`);
  const resolvedClassName = typeof className === "function"
    ? className({ isActive })
    : className;

  return <NextLink className={resolvedClassName} href={to} {...props} />;
}

export function Navigate({ replace = false, to }) {
  const router = useRouter();

  useEffect(() => {
    if (replace) router.replace(to);
    else router.push(to);
  }, [replace, router, to]);

  return null;
}

export function useLocation() {
  const pathname = usePathname();
  return useMemo(() => ({ pathname }), [pathname]);
}

export function useNavigate() {
  const router = useRouter();
  return useCallback((to, options = {}) => {
    if (options.replace) router.replace(to);
    else router.push(to);
  }, [router]);
}

export function useParams() {
  return useNextParams();
}
