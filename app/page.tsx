"use client";

import { useAuth } from "./context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Loader2,
  Car,
  Wrench,
  ShieldCheck,
  Bell,
  FileText,
  TrendingUp,
  Users,
  Settings,
  Globe,
  Lock,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { Button } from "@/app/components/ui";
import Link from "next/link";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'garage') router.replace('/garage');
      else router.replace('/owner');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="animate-spin text-primary w-12 h-12" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
      {/* Navbar Minimal */}
      <nav className="fixed top-0 w-full bg-panel/80 backdrop-blur-md border-b border-panel-border z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Panora Auto" className="h-8 w-auto object-contain" />
            <span className="font-bold text-xl text-primary tracking-tight">Panora Auto</span>
          </div>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost" className="border-2 border-primary/20 hover:bg-primary/5 text-primary text-sm font-semibold hidden sm:flex h-10">Log In</Button>
            </Link>
            <Link href="/login">
              <Button variant="primary" className="text-sm font-semibold h-10 px-4">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative px-4 py-16 sm:py-24 lg:py-32 overflow-hidden flex items-center min-h-[calc(100vh-4rem)]">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-full h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 translate-x-1/3" />

          <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-6 sm:mb-8 border border-primary/20 shadow-sm animate-fade-in mx-auto lg:mx-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                The Ultimate Digital Logbook
              </div>

              <h1 className="text-5xl sm:text-6xl xl:text-7xl font-extrabold text-foreground tracking-tight mb-6 leading-[1.1]">
                Smart Vehicles. <br className="hidden lg:block" />
                <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">Smarter Management.</span>
              </h1>

              <p className="text-lg md:text-xl text-foreground/70 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Protect your investment and streamline your maintenance. Panora Auto brings your vehicle's entire history, documents, and service reminders into one secure digital ecosystem.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center w-full sm:w-auto">
                <Link href="/login" className="w-full sm:w-auto">
                  <Button variant="primary" className="w-full sm:w-auto h-14 sm:h-16 px-10 text-lg font-bold shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all transition-transform rounded-2xl">
                    Log In
                  </Button>
                </Link>
                <Link href="/login" className="w-full sm:w-auto">
                  <Button variant="ghost" className="w-full sm:w-auto h-14 sm:h-16 px-10 text-lg font-bold border-2 border-panel-border hover:border-primary/30 group hover:bg-primary/5 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all">
                    Create Free Account
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform text-primary" />
                  </Button>
                </Link>
              </div>

              <div className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-sm text-foreground/60 font-medium">
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-success" /> No Credit Card</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-success" /> Setup in Minutes</span>
              </div>
            </div>

            {/* Right Content / Image Area */}
            <div className="relative w-full aspect-[4/3] lg:aspect-square max-w-2xl mx-auto hidden md:block">
              {/* Decorative blobs behind image */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-gradient-to-tr from-primary/20 via-blue-400/10 to-transparent rounded-full blur-[60px] -z-10" />

              {/* Floating Review Card */}
              <div className="absolute -left-8 top-1/4 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white z-20 animate-fade-in hidden lg:flex items-center gap-4">
                <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-success" />
                </div>
                <div>
                  <div className="font-bold text-sm">Service History Saved</div>
                  <div className="text-xs text-foreground/60">2 mins ago</div>
                </div>
              </div>

              {/* Main Image Container */}
              <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-black/5 bg-slate-100 flex items-center justify-center">
                <video
                  src="/hero-video.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover rounded-[2.5rem] hover:scale-105 transition-transform duration-700 ease-out"
                />

                {/* Gradient overlay to make it look premium */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        </section>

        {/* Features for Owners */}
        <section className="py-20 px-4 bg-white border-y border-panel-border">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6 ring-8 ring-primary/5">
                <Car className="w-8 h-8" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">For Vehicle Owners</h2>
              <p className="text-lg text-foreground/60 max-w-2xl mx-auto">Protect your investment with comprehensive digital records and proactive maintenance tools.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={<ShieldCheck className="w-6 h-6" />}
                title="Smart Maintenance Tracking"
                description="Keep a complete digital record of all your vehicle services, repairs, inspections, and replacements — all stored securely in one place. No more lost bills or forgotten service history."
              />
              <FeatureCard
                icon={<Bell className="w-6 h-6" />}
                title="Proactive Service Alerts"
                description="Never miss an oil change, tire rotation, insurance renewal, or emission test. Get automated reminders based on mileage, time intervals, or manufacturer recommendations."
              />
              <FeatureCard
                icon={<TrendingUp className="w-6 h-6" />}
                title="Protect & Increase Resale Value"
                description="A well-documented service history significantly increases buyer trust. With Panora Auto, your vehicle's digital logbook becomes proof of proper maintenance."
              />
              <FeatureCard
                icon={<FileText className="w-6 h-6" />}
                title="Digital Document Vault"
                description="Store insurance documents, revenue licenses, warranties, emission certificates, and ownership records securely and access them anytime, anywhere."
              />
              <FeatureCard
                icon={<CheckCircle className="w-6 h-6" />}
                title="Real-Time Service Updates"
                description="Receive instant notifications when your vehicle is serviced. Track what was done, what parts were replaced, and what’s due next."
              />
            </div>
          </div>
        </section>

        {/* Features for Garages */}
        <section className="py-20 px-4 relative overflow-hidden">
          <div className="absolute top-1/2 left-0 w-full h-full bg-orange-500/5 rounded-full blur-[100px] -z-10 -translate-y-1/2" />
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 mb-6 ring-8 ring-orange-100/50">
                <Wrench className="w-8 h-8" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">For Garages & Service Centers</h2>
              <p className="text-lg text-foreground/60 max-w-2xl mx-auto">Modernize your operations and build lasting customer relationships.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={<FileText className="w-6 h-6" />}
                title="Digital Service Records"
                description="Create and manage service records digitally. Provide customers with transparent, professional service documentation."
                color="orange"
              />
              <FeatureCard
                icon={<Users className="w-6 h-6" />}
                title="Customer Management System"
                description="Maintain customer history, track previous services, and build long-term relationships with automated follow-ups."
                color="orange"
              />
              <FeatureCard
                icon={<Bell className="w-6 h-6" />}
                title="Service Reminders & Engagement"
                description="Send automated maintenance reminders to customers to increase repeat business and improve retention rates."
                color="orange"
              />
              <FeatureCard
                icon={<Settings className="w-6 h-6" />}
                title="Operational Efficiency"
                description="Reduce paperwork, eliminate manual errors, and manage service workflows more efficiently."
                color="orange"
              />
              <FeatureCard
                icon={<ShieldCheck className="w-6 h-6" />}
                title="Brand Credibility"
                description="Position your garage as a modern, tech-enabled service provider that values transparency and customer trust."
                color="orange"
              />
            </div>
          </div>
        </section>

        {/* Ecosystem & Security */}
        <section className="py-24 px-4 bg-[#0F172A] text-white">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20 text-primary mb-6">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">One Connected Vehicle Ecosystem</h2>
              <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                Panora Auto bridges the gap between vehicle owners and service providers by creating a transparent, trusted, and efficient maintenance network.
              </p>
              <ul className="space-y-4">
                {[
                  "Secure Cloud Storage",
                  "Real-Time Data Access",
                  "Mobile-Friendly Platform",
                  "Scalable for Individuals & Businesses",
                  "Data-Driven Insights"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-200">
                    <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 p-8 sm:p-10 rounded-3xl relative overflow-hidden backdrop-blur-sm shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -z-10 translate-x-1/3 -translate-y-1/3" />
              <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center mb-6">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Security & Reliability</h3>
              <p className="text-slate-300 leading-relaxed mb-6">
                Your vehicle data is valuable. That’s why Panora Auto uses secure, encrypted cloud infrastructure to protect your information. Only authorized users can access service records and documentation.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4 bg-white border-b border-panel-border relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] pointer-events-none mix-blend-overlay"></div>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">💡 Why Choose Panora Auto?</h2>
            <div className="flex flex-wrap justify-center gap-3 mb-16">
              {[
                "No more paper records",
                "No missed maintenance schedules",
                "Increased resale value",
                "Stronger trust between garages & customers",
                "All vehicle information in one place"
              ].map((reason, i) => (
                <div key={i} className="bg-primary/5 border border-primary/10 text-primary-hover px-5 py-2.5 rounded-full font-medium flex items-center gap-2 shadow-sm">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  {reason}
                </div>
              ))}
            </div>

            <div className="bg-background border border-panel-border rounded-3xl p-8 sm:p-14 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-foreground/5 relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
              <h2 className="text-3xl md:text-4xl font-bold mb-6">🚀 Take Control of Your Vehicle’s Future</h2>
              <p className="text-xl text-foreground/60 mb-10 max-w-2xl mx-auto leading-relaxed">
                Managing vehicle maintenance shouldn’t be complicated. With Panora Auto, everything is organized, automated, and accessible.
              </p>
              <Link href="/login">
                <Button variant="primary" className="h-14 px-8 text-lg font-bold group shadow-lg shadow-primary/20">
                  Start your digital vehicle journey today
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-background py-16 text-center text-foreground/60">
        <div className="flex items-center justify-center gap-2 mb-6">
          <img src="/logo.png" alt="Panora Auto" className="h-8 w-auto object-contain grayscale opacity-60" />
          <span className="font-bold text-xl tracking-tight text-foreground/80">Panora Auto</span>
        </div>
        <p className="font-medium text-foreground/50">Smart Vehicles. Smarter Management.</p>
        <p className="mt-4 text-sm">© {new Date().getFullYear()} Panora Auto. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  color = "primary"
}: {
  icon: React.ReactNode,
  title: string,
  description: string,
  color?: "primary" | "orange"
}) {
  const isOrange = color === "orange";

  return (
    <div className="p-6 md:p-8 rounded-2xl border border-panel-border bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${isOrange
        ? 'bg-orange-50 text-orange-600'
        : 'bg-primary/10 text-primary'
        }`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
      <p className="text-foreground/60 leading-relaxed text-sm md:text-base">{description}</p>
    </div>
  );
}
