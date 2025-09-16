"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Search, Phone, Building } from "lucide-react";
import axios from "axios";
import { Button } from "./Buttons";
import { isTokenExpired } from "../utils/tokenCheker";
interface Stats {
  totalClients: number;
  pendingDeals: number;
}

export default function Dashboard() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || localStorage.getItem("Token")
      : null;
  const shouldShowDashboard = token && !isTokenExpired(token);

  const handleSignUp = () => {
    router.push("/auth/register");
  };

  const handleSignIn = () => {
    router.push("/auth/login");
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/buyer/get_count`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        setStats({
          totalClients: response.data.totalClients,
          pendingDeals: response.data.pendingDeals,
        });
      } else {
        setError("Failed to fetch stats.");
      }
    } catch (err) {
      console.error(err);
      setError("Error fetching stats.");
    } finally {
      setLoading(false);
    }
  };

  const checkAuthStatus = () => {
    if (typeof window === "undefined") return;

    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("Token");

      if (token && isTokenExpired(token)) {
        alert("Token expired! Please log in again.");
        localStorage.removeItem("token");
        localStorage.removeItem("Token");
      }
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);

    if (shouldShowDashboard) {
      fetchStats();
    } else {
      checkAuthStatus();
    }
  }, [shouldShowDashboard]);

  useEffect(() => {
    if (!mounted) return;

    const handleAuthChange = () => {
      checkAuthStatus();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token" || e.key === "Token") {
        checkAuthStatus();
      }
    };

    window.addEventListener("authStateChanged", handleAuthChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("authStateChanged", handleAuthChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [mounted]);

  const statsData = [
    { title: "Total Clients", value: stats?.totalClients || 0 },
    { title: "Pending Deals", value: stats?.pendingDeals || 0 },
  ];

  const quickActions = [
    {
      icon: Users,
      title: "Add Client",
      desc: "Register new client",
      color: "green",
      onClick: () => router.push("/buyers/new"),
    },
    {
      icon: Search,
      title: "Search",
      desc: "Find properties/clients",
      color: "primary",
      onClick: () => router.push("/buyers"),
    },
    {
      icon: Phone,
      title: "Contact Us",
      desc: "Contact Our Team",
      color: "primary",
      onClick: () => router.push("/contact"),
    },
    {
      icon: Building,
      title: "About Us",
      desc: "Get Know About Us",
      color: "primary",
      onClick: () => router.push("/about"),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading buyer details...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {shouldShowDashboard ? (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 relative overflow-hidden">
          <main className="mt-25 relative z-10 max-w-7xl mx-auto px-6 py-8">
            <div className="mb-12">
              <h2 className="text-4xl font-bold text-slate-800 mb-2">
                Welcome back!
              </h2>
              <p className="text-xl text-slate-600">
                Here's what's happening with your properties today.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {statsData.map((stat, index) => (
                <div
                  key={stat.title}
                  className="group bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 hover:bg-white transition-all duration-500 hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-600 text-sm uppercase tracking-wide">
                      {stat.title}
                    </h3>
                  </div>
                  <p className="text-3xl font-bold text-slate-800 group-hover:text-primary-700 transition-colors">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="mb-12">
              <h3 className="text-2xl font-bold text-slate-800 mb-6">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {quickActions.map((action) => {
                  const Icon = action.icon;

                  return (
                    <div
                      key={action.title}
                      onClick={action.onClick}
                      className="group bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 hover:bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                    >
                      <div className="w-14 h-14 bg-primary-200 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300">
                        <Icon className="w-7 h-7" />
                      </div>
                      <h4 className="font-semibold text-slate-800 mb-2">
                        {action.title}
                      </h4>
                      <p className="text-slate-600 text-sm">{action.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-3xl p-8 text-center text-white">
              <h3 className="text-3xl font-bold mb-4">
                Ready to capture your first lead?
              </h3>
              <p className="text-primary-100 mb-8 text-lg">
                Start building your buyer database and convert more prospects
                into customers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                  onClick={() => router.push("/buyers/new")}
                >
                  Add Lead
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
                  onClick={() => router.push("/buyers")}
                >
                  View All Leads
                </Button>
              </div>
            </div>
          </main>
        </div>
      ) : (
        <div className="w-full min-h-screen bg-primary-100/40 flex items-center justify-center">
          <div className="text-center max-w-4xl px-6">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8">
              Welcome to <span className="text-primary-800">Home Quest</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed">
              Your All New CRM for Properties
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg" onClick={handleSignUp}>
                Sign Up
              </Button>

              <Button variant="outline" size="lg" onClick={handleSignIn}>
                Sign In
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
