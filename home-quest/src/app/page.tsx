"use client"
import React, { useEffect, useState } from 'react';
import { Button } from './components/Buttons';
import { useRouter } from 'next/navigation';
import { isTokenExpired } from './components/utils/tokenCheker';
import { Plus, Search, Users, BarChart3, Bell, Settings, LogOut } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleSignUp = () => {
    router.push("/auth/register");
  };

  const handleSignIn = () => {
    router.push("/auth/login");
  };

  const checkAuthStatus = () => {
    if (typeof window === "undefined") return;

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("Token");

      if (token) {
        const expired = isTokenExpired(token);
        if (expired) {
          alert("Token expired! Please log in again.");
          localStorage.removeItem("token");
          localStorage.removeItem("Token");
          setIsLoggedIn(false);
        } else {
          console.log("Token is still valid");
          setIsLoggedIn(true);
        }
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsLoaded(true);
    setMounted(true);
    
    const handleMouseMove = (e:any) => {
      setMousePosition({ 
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    checkAuthStatus();

    const handleAuthChange = () => {
      checkAuthStatus();
    };

    const handleStorageChange = (e:any) => {
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

  const stats = [
    { title: 'Active Properties', value: '247', change: '+12%', trend: 'up' },
    { title: 'Total Clients', value: '156', change: '+8%', trend: 'up' },
    { title: 'Monthly Revenue', value: '$84.2k', change: '+15%', trend: 'up' },
    { title: 'Pending Deals', value: '23', change: '+3%', trend: 'up' }
  ];

  const quickActions = [
    { icon: Plus, title: 'Add Property', desc: 'List new property', color: 'primary' },
    { icon: Users, title: 'Add Client', desc: 'Register new client', color: 'green' },
    { icon: Search, title: 'Search', desc: 'Find properties/clients', color: 'primary' },
    { icon: BarChart3, title: 'Analytics', desc: 'View performance', color: 'purple' }
  ];

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is logged in (token exists and not expired)
  const token = typeof window !== "undefined" ? (localStorage.getItem("token") || localStorage.getItem("Token")) : null;
  const shouldShowDashboard = token && !isTokenExpired(token);

  return (
    <>
      {shouldShowDashboard ? (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 relative overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div 
              className="absolute w-96 h-96 rounded-full opacity-10 blur-3xl transition-all duration-[3000ms] ease-out"
              style={{
                background: `radial-gradient(circle, #3b82f6 0%, transparent 70%)`,
                left: `${20 + mousePosition.x * 0.02}%`,
                top: `${10 + mousePosition.y * 0.01}%`,
                transform: 'translate(-50%, -50%)'
              }}
            />
            <div 
              className="absolute w-80 h-80 rounded-full opacity-8 blur-2xl transition-all duration-[4000ms] ease-out"
              style={{
                background: `radial-gradient(circle, #3b82f6 0%, transparent 70%)`,
                right: `${15 + mousePosition.x * -0.015}%`,
                bottom: `${20 + mousePosition.y * -0.01}%`,
                transform: 'translate(50%, 50%)'
              }}
            />
          </div>

          {/* Main Content */}
          <main className=" mt-25 relative z-10 max-w-7xl mx-auto px-6 py-8">
            {/* Welcome Section */}
            <div className={`mb-12 transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <h2 className="text-4xl font-bold text-slate-800 mb-2">
                Welcome back! 
              </h2>
              <p className="text-xl text-slate-600">Here's what's happening with your properties today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {stats.map((stat, index) => (
                <div 
                  key={stat.title}
                  className={`group bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 hover:bg-white transition-all duration-500 hover:shadow-lg hover:-translate-y-1 ${
                    isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                  }`}
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-600 text-sm uppercase tracking-wide">{stat.title}</h3>
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      stat.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {stat.change}
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-slate-800 group-hover:text-primary-700 transition-colors">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className={`mb-12 transition-all duration-1000 delay-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <h3 className="text-2xl font-bold text-slate-800 mb-6">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  const colorClasses:any = {
                    primary: 'bg-primary-100 text-primary-700 group-hover:bg-primary-200',
                    green: 'bg-green-100 text-green-700 group-hover:bg-green-200',
                    primary: 'bg-primary-100 text-primary-700 group-hover:bg-primary-200',
                    purple: 'bg-purple-100 text-purple-700 group-hover:bg-purple-200'
                  };
                  
                  return (
                    <div 
                      key={action.title}
                      className="group bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 hover:bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                    >
                      <div className={`w-14 h-14 ${colorClasses[action.color]} rounded-2xl flex items-center justify-center mb-4 transition-all duration-300`}>
                        <Icon className="w-7 h-7" />
                      </div>
                      <h4 className="font-semibold text-slate-800 mb-2">{action.title}</h4>
                      <p className="text-slate-600 text-sm">{action.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CTA Section */}
            <div className={`bg-gradient-to-r from-primary-600 to-primary-800 rounded-3xl p-8 text-center text-white transition-all duration-1000 delay-700 ${
          isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}>
              <h3 className="text-3xl font-bold mb-4">Ready to capture your first lead?</h3>
              <p className="text-primary-100 mb-8 text-lg">Start building your buyer database and convert more prospects into customers.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="secondary" 
                  size="lg"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                  onClick={() => router.push('/buyers/new')}
                >
                  Add Lead
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
                  onClick={() => router.push('/buyers')}
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
              <Button 
                variant="primary" 
                size="lg" 
                onClick={handleSignUp}
              >
                Sign Up
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                onClick={handleSignIn}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}