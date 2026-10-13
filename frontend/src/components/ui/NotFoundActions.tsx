"use client";

import { useAuth } from "@/components/app/AuthProvider";
import LinkButton from "@/components/ui/LinkButton";

export default function NotFoundActions() {
  const { user } = useAuth();
  return (
    <>
      <LinkButton href={user ? "/dashboard" : "/courses"}>Browse courses</LinkButton>
      <LinkButton href={user ? "/dashboard" : "/"} variant="secondary">
        Go home
      </LinkButton>
    </>
  );
}