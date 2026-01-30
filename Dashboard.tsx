import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  IndianRupee, 
  Users, 
  FileText, 
  Package, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalRevenue: number;
  totalCustomers: number;
  totalInvoices: number;
  pendingInvoices: number;
  lowStockItems: number;
  recentInvoices: any[];
  monthlyRevenue: any[];
  invoiceStatus: any[];
}

const COLORS = ['hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)', 'hsl(220, 9%, 46%)'];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalCustomers: 0,
    totalInvoices: 0,
    pendingInvoices: 0,
    lowStockItems: 0,
    recentInvoices: [],
    monthlyRevenue: [],
    invoiceStatus: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      subscribeToChanges();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch customers count
      const { count: customersCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      // Fetch invoices data
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch low stock items
      const { count: lowStockCount } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true })
        .lt('quantity', 10);

      const totalRevenue = invoices?.reduce((sum, inv) => 
        inv.status === 'paid' ? sum + Number(inv.total_amount) : sum, 0) || 0;
      
      const pendingInvoices = invoices?.filter(inv => 
        inv.status === 'sent' || inv.status === 'overdue').length || 0;

      // Calculate invoice status distribution
      const statusCounts = {
        paid: invoices?.filter(i => i.status === 'paid').length || 0,
        sent: invoices?.filter(i => i.status === 'sent').length || 0,
        overdue: invoices?.filter(i => i.status === 'overdue').length || 0,
        draft: invoices?.filter(i => i.status === 'draft').length || 0,
      };

      const invoiceStatus = [
        { name: 'Paid', value: statusCounts.paid },
        { name: 'Sent', value: statusCounts.sent },
        { name: 'Overdue', value: statusCounts.overdue },
        { name: 'Draft', value: statusCounts.draft },
      ].filter(s => s.value > 0);

      // Mock monthly revenue data (in production, calculate from actual invoices)
      const monthlyRevenue = [
        { month: 'Jan', revenue: 45000 },
        { month: 'Feb', revenue: 52000 },
        { month: 'Mar', revenue: 48000 },
        { month: 'Apr', revenue: 61000 },
        { month: 'May', revenue: 55000 },
        { month: 'Jun', revenue: 67000 },
      ];

      setStats({
        totalRevenue,
        totalCustomers: customersCount || 0,
        totalInvoices: invoices?.length || 0,
        pendingInvoices,
        lowStockItems: lowStockCount || 0,
        recentInvoices: invoices?.slice(0, 5) || [],
        monthlyRevenue,
        invoiceStatus,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToChanges = () => {
    const channel = supabase
      .channel('dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, fetchDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, fetchDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, fetchDashboardData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: IndianRupee,
      trend: '+12.5%',
      trendUp: true,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers.toString(),
      icon: Users,
      trend: '+5.2%',
      trendUp: true,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Total Invoices',
      value: stats.totalInvoices.toString(),
      icon: FileText,
      trend: '+8.1%',
      trendUp: true,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockItems.toString(),
      icon: Package,
      trend: stats.lowStockItems > 0 ? 'Needs attention' : 'All good',
      trendUp: stats.lowStockItems === 0,
      color: stats.lowStockItems > 0 ? 'text-warning' : 'text-success',
      bgColor: stats.lowStockItems > 0 ? 'bg-warning/10' : 'bg-success/10',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your business overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => (
            <Card key={stat.title} className="stat-card animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={cn("p-3 rounded-xl", stat.bgColor)}>
                    <stat.icon className={cn("h-6 w-6", stat.color)} />
                  </div>
                  <div className={cn(
                    "flex items-center text-sm font-medium",
                    stat.trendUp ? "text-success" : "text-destructive"
                  )}>
                    {stat.trendUp ? (
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 mr-1" />
                    )}
                    {stat.trend}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Revenue Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-success" />
                Revenue Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.monthlyRevenue}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-muted-foreground" />
                    <YAxis className="text-muted-foreground" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem'
                      }}
                      formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(239, 84%, 67%)" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Status Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Invoice Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.invoiceStatus.length > 0 ? (
                <div className="h-[300px] flex flex-col items-center justify-center">
                  <ResponsiveContainer width="100%" height="80%">
                    <PieChart>
                      <Pie
                        data={stats.invoiceStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.invoiceStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-4 mt-4">
                    {stats.invoiceStatus.map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm text-muted-foreground">
                          {entry.name} ({entry.value})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No invoices yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {stats.lowStockItems > 0 && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-3 rounded-full bg-warning/10">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="font-medium text-foreground">Low Stock Alert</p>
                <p className="text-sm text-muted-foreground">
                  {stats.lowStockItems} item{stats.lowStockItems > 1 ? 's' : ''} running low on stock. 
                  Check inventory to restock.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
