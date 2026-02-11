import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Calendar,
  GripVertical,
  CalendarOff,
  ArrowLeftRight,
  MessageSquare,
  Bell,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Server,
  CloudOff,
  Github,
} from "lucide-react";

const features = [
  {
    icon: GripVertical,
    title: "Drag & Drop Scheduling",
    description:
      "Build schedules visually with an intuitive drag-and-drop interface. Assign shifts in seconds, not hours.",
  },
  {
    icon: CalendarOff,
    title: "Time-Off Management",
    description:
      "Employees submit time-off requests that managers can approve or deny with a single click.",
  },
  {
    icon: ArrowLeftRight,
    title: "Shift Swaps",
    description:
      "Let employees swap shifts with each other seamlessly, with manager approval workflows built in.",
  },
  {
    icon: MessageSquare,
    title: "Team Messaging",
    description:
      "Keep your team connected with built-in messaging. Broadcast updates or chat one-on-one.",
  },
  {
    icon: Bell,
    title: "Real-Time Notifications",
    description:
      "Instant alerts for schedule changes, swap requests, and time-off approvals keep everyone in the loop.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    description:
      "Track labor costs, overtime, and coverage gaps with actionable reports and dashboards.",
  },
];

const steps = [
  {
    number: 1,
    title: "Create Schedule",
    description:
      "Set up your locations, roles, and recurring shift templates in minutes.",
  },
  {
    number: 2,
    title: "Assign Shifts",
    description:
      "Drag employees onto shifts or let the system auto-fill based on availability and skills.",
  },
  {
    number: 3,
    title: "Manage Easily",
    description:
      "Handle swaps, time-off, and last-minute changes from one unified dashboard.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold" data-testid="text-logo">
              ShiftFlow
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" data-testid="link-login">
                Log In
              </Button>
            </Link>
            <Link href="/register">
              <Button data-testid="link-signup">Sign Up</Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700" />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6 py-24 md:py-32">
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
            data-testid="text-hero-heading"
          >
            Smart Employee Scheduling Made Simple
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10">
            Stop wrestling with spreadsheets. ShiftFlow gives managers and
            employees the tools to build, share, and manage shift schedules
            effortlessly.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" data-testid="button-get-started">
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button
                variant="outline"
                size="lg"
                className="backdrop-blur-sm bg-white/10 text-white border-white/30"
                data-testid="button-how-it-works"
              >
                See How It Works
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3" data-testid="text-features-heading">
            Everything You Need to Manage Shifts
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            A complete toolkit for shift-based teams, from scheduling to
            communication.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="p-6" data-testid={`card-feature-${feature.title.toLowerCase().replace(/\s+/g, "-")}`}>
              <feature.icon className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="bg-muted/50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3" data-testid="text-how-it-works-heading">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Get up and running in three simple steps.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-5">
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-3" data-testid="text-pricing-heading">
            Simple, Transparent Pricing
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            ShiftFlow is open-source and self-hosted. No per-seat fees, ever.
          </p>
        </div>
        <Card className="p-8 max-w-md mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Server className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-bold">Self-Hosted</h3>
          </div>
          <p className="text-4xl font-bold mb-1">Free</p>
          <p className="text-muted-foreground text-sm mb-6">
            Open-source, forever
          </p>
          <ul className="text-left space-y-3 mb-8">
            {[
              "Unlimited employees & locations",
              "All scheduling features included",
              "Deploy on any cloud or on-premise",
              "Full source code access",
              "Community support via GitHub",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-3">
            <Link href="/register">
              <Button className="w-full" data-testid="button-pricing-get-started">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="w-full" data-testid="button-view-source">
                <Github className="w-4 h-4 mr-2" />
                View Source
              </Button>
            </a>
          </div>
        </Card>
        <div className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground">
          <CloudOff className="w-4 h-4" />
          <span>Cloud-agnostic. Deploy anywhere you want.</span>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} ShiftFlow. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <span
                className="text-sm text-muted-foreground underline-offset-4 hover:underline cursor-pointer"
                data-testid="link-footer-login"
              >
                Log In
              </span>
            </Link>
            <Link href="/register">
              <span
                className="text-sm text-muted-foreground underline-offset-4 hover:underline cursor-pointer"
                data-testid="link-footer-signup"
              >
                Sign Up
              </span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
