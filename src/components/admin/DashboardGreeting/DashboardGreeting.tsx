"use client";

import { useEffect, useState } from "react";

export function DashboardGreeting() {
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    const hour = Number(new Intl.DateTimeFormat(undefined, { hour: "numeric", hour12: false }).format(new Date()));
    setGreeting(hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");
  }, []);

  return <h1 className="heading-01 dashboardTitle">{greeting}, Andrei</h1>;
}
