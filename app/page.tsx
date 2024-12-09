'use client';
import { useAuth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

export default function Home() {
  const { userId } = useAuth()
  if (!userId) {
    redirect("/sign-in");
  } else {
    redirect("/dashboard");
  }
}
