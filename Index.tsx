import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Package, 
  Bot,
  ArrowRight,
  CheckCircle,
  Sparkles
} from 'lucide-react';

const features = [
  {
    icon: LayoutDashboard,
    title: 'Real-time Dashboard',
    description: 'Monitor your business metrics with live updates and beautiful charts.',
  },
  {
    icon: FileText,
    title: 'Invoice Management',
    description: 'Create, send, and track invoices with GST support and payment status.',
  },
  {
    icon: Users,
    title: 'Customer Management',
    description: 'Keep track of your customers, their purchases, and outstanding balances.',
  },
  {
    icon: Package,
    title: 'Stock Management',
    description: 'Monitor inventory levels, get low stock alerts, and manage products.',
  },
  {
    icon: Bot,
    title: 'AI Assistant',
    description: 'Get intelligent insights and assistance for all your business operations.',
  },
];

const benefits = [
  'No complex setup required',
  'GST compliant invoicing',
  'Real-time inventory tracking',
  'AI-powered business insights',
  'Secure cloud storage',
  'Works on all devices',
];

export default function Index() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-60 h-60 rounded-full bg-success/10 blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 py-20">
          {/* Navigation */}
          <nav className="flex justify-between items-center mb-20">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                <span className="text-xl font-bold text-primary-foreground">V</span>
              </div>
              <span className="text-2xl font-bold text-foreground">VYAPAR AI</span>
            </div>
            <div className="flex items-center gap-4">
              {loading ? null : user ? (
                <Link to="/dashboard">
                  <Button className="gradient-primary">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/auth">
                    <Button variant="ghost">Sign In</Button>
                  </Link>
                  <Link to="/auth">
                    <Button className="gradient-primary">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>

          {/* Hero Content */}
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium animate-fade-in">
              <Sparkles className="h-4 w-4" />
              AI-Powered Business Management
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-foreground animate-slide-up">
              Manage Your Business
              <span className="block gradient-hero bg-clip-text text-transparent">
                Smarter with AI
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '100ms' }}>
              VYAPAR AI is your complete business companion. Create invoices, manage customers, 
              track inventory, and get AI-powered insights—all in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '200ms' }}>
              <Link to="/auth">
                <Button size="lg" className="gradient-primary text-lg px-8 h-14 shadow-glow">
                  Start Free Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 h-14">
                Watch Demo
              </Button>
            </div>

            {/* Benefits */}
            <div className="flex flex-wrap justify-center gap-4 pt-8 animate-fade-in" style={{ animationDelay: '300ms' }}>
              {benefits.slice(0, 4).map((benefit) => (
                <div key={benefit} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-success" />
                  {benefit}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Run Your Business
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed for Indian businesses. Simple to use, yet comprehensive.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="group p-6 bg-card rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="relative rounded-3xl overflow-hidden gradient-primary p-12 md:p-20 text-center">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-6">
                Ready to Transform Your Business?
              </h2>
              <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
                Join thousands of businesses already using VYAPAR AI to streamline their operations.
              </p>
              <Link to="/auth">
                <Button size="lg" variant="secondary" className="text-lg px-8 h-14">
                  Get Started for Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 VYAPAR AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
