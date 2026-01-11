'use client';
import Link from 'next/link';
import { Brain, Activity, TrendingUp, Shield, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';

export default function LandingPage() {
  const stats = [
    { value: '90%', label: 'Accuracy in Studies' },
    { value: '2-5yr', label: 'Earlier Detection Potential' },
    { value: '<3min', label: 'Average Test Time' },
    { value: 'Private', label: 'Secure & Anonymous' },
  ];

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Detection',
      desc: 'Our advanced machine learning algorithms analyze subtle patterns to identify potential risks early.',
    },
    {
      icon: Activity,
      title: 'Multi-Modal Testing',
      desc: 'We use a combination of spiral drawing, voice analysis, and tapping tests for a comprehensive assessment.',
    },
    {
      icon: TrendingUp,
      title: 'Track Your Progress',
      desc: 'Monitor your neurological health over time with intuitive charts and detailed reports.',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      desc: 'Your data is encrypted and stored securely. Your privacy is our top priority.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Logo />
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-6 text-center">
            <div className="bg-accent/10 text-accent-foreground border border-accent/20 rounded-full px-4 py-1 inline-block mb-4 text-sm font-medium">
              Early Detection, Better Outcomes
            </div>
            <h1 className="text-4xl md:text-6xl font-bold font-headline mb-6">
              Take Control of Your Neurological Health
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
              NeuroVita provides accessible, AI-powered tests to help you monitor for early signs of neurological conditions like Parkinson's disease, right from home.
            </p>
            <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/register">
                Start Your First Test <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="py-20 bg-card/50">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {stats.map((stat, i) => (
                <div key={i}>
                  <p className="text-4xl font-bold font-headline text-primary mb-2">{stat.value}</p>
                  <p className="text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 md:py-32">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold font-headline mb-4">How It Works</h2>
              <p className="text-muted-foreground">
                Our platform uses a simple, three-step process to provide you with valuable health insights.
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-8">
              {features.map((feature, i) => (
                <div key={i} className="bg-card p-6 rounded-lg border border-border transition-all hover:border-primary/50 hover:shadow-lg hover:-translate-y-1">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold font-headline mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} NeuroVita. All rights reserved.</p>
          <p className="text-xs mt-2">
            Disclaimer: NeuroVita is not a medical device and should not be used for diagnosis. Always consult with a qualified healthcare professional.
          </p>
        </div>
      </footer>
    </div>
  );
}
