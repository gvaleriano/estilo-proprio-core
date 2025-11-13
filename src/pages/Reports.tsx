import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, TrendingUp, DollarSign, Users, Package } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

interface SalesData {
  date: string;
  total: number;
  count: number;
}

interface ProductSales {
  title: string;
  quantity: number;
  revenue: number;
}

interface ClientStats {
  name: string;
  purchases: number;
  total: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function Reports() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  const [salesByDay, setSalesByDay] = useState<SalesData[]>([]);
  const [topProducts, setTopProducts] = useState<ProductSales[]>([]);
  const [topClients, setTopClients] = useState<ClientStats[]>([]);
  const [cashFlowData, setCashFlowData] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalSales: 0,
    avgTicket: 0,
    totalClients: 0,
  });

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      fetchReports();
    }
  }, [dateRange]);

  const fetchReports = async () => {
    try {
      const fromDate = dateRange?.from?.toISOString();
      const toDate = dateRange?.to?.toISOString();

      // Fetch sales data
      const { data: sales, error: salesError } = await supabase
        .from("sales")
        .select("*")
        .gte("created_at", fromDate)
        .lte("created_at", toDate)
        .order("created_at", { ascending: true });

      if (salesError) throw salesError;

      // Process sales by day
      const salesByDayMap = new Map<string, { total: number; count: number }>();
      let totalRevenue = 0;
      
      sales?.forEach((sale) => {
        const date = format(new Date(sale.created_at), "dd/MM");
        const current = salesByDayMap.get(date) || { total: 0, count: 0 };
        salesByDayMap.set(date, {
          total: current.total + Number(sale.total),
          count: current.count + 1,
        });
        totalRevenue += Number(sale.total);
      });

      setSalesByDay(
        Array.from(salesByDayMap.entries()).map(([date, data]) => ({
          date,
          total: data.total,
          count: data.count,
        }))
      );

      // Process top products
      const productsMap = new Map<string, { quantity: number; revenue: number }>();
      sales?.forEach((sale) => {
        const items = sale.items as any[];
        items?.forEach((item) => {
          const current = productsMap.get(item.title) || { quantity: 0, revenue: 0 };
          productsMap.set(item.title, {
            quantity: current.quantity + item.quantity,
            revenue: current.revenue + item.price * item.quantity,
          });
        });
      });

      setTopProducts(
        Array.from(productsMap.entries())
          .map(([title, data]) => ({ title, ...data }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10)
      );

      // Fetch clients data
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("id, name");

      if (clientsError) throw clientsError;

      // Process top clients
      const clientsMap = new Map<string, { name: string; purchases: number; total: number }>();
      sales?.forEach((sale) => {
        if (sale.client_id) {
          const client = clients?.find((c) => c.id === sale.client_id);
          if (client) {
            const current = clientsMap.get(sale.client_id) || { name: client.name, purchases: 0, total: 0 };
            clientsMap.set(sale.client_id, {
              name: client.name,
              purchases: current.purchases + 1,
              total: current.total + Number(sale.total),
            });
          }
        }
      });

      setTopClients(
        Array.from(clientsMap.values())
          .sort((a, b) => b.total - a.total)
          .slice(0, 5)
      );

      // Fetch cash flow
      const { data: cashFlow, error: cashError } = await supabase
        .from("cash_flow")
        .select("*")
        .gte("created_at", fromDate)
        .lte("created_at", toDate)
        .order("created_at", { ascending: true });

      if (cashError) throw cashError;

      const cashByDay = new Map<string, { income: number; expense: number }>();
      cashFlow?.forEach((entry) => {
        const date = format(new Date(entry.created_at), "dd/MM");
        const current = cashByDay.get(date) || { income: 0, expense: 0 };
        if (entry.type === "in") {
          current.income += Number(entry.amount);
        } else {
          current.expense += Number(entry.amount);
        }
        cashByDay.set(date, current);
      });

      setCashFlowData(
        Array.from(cashByDay.entries()).map(([date, data]) => ({
          date,
          ...data,
        }))
      );

      // Calculate summary
      setSummary({
        totalRevenue,
        totalSales: sales?.length || 0,
        avgTicket: totalRevenue / (sales?.length || 1),
        totalClients: clientsMap.size,
      });
    } catch (error: any) {
      toast.error("Erro ao carregar relatórios: " + error.message);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios Avançados</h1>
          <p className="text-muted-foreground">Análise completa do desempenho da loja</p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                  </>
                ) : (
                  format(dateRange.from, "dd/MM/yyyy")
                )
              ) : (
                "Selecionar período"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {summary.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Realizadas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalSales}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {summary.avgTicket.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalClients}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Dia</CardTitle>
            <CardDescription>Evolução das vendas no período selecionado</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" name="Valor Total" />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--secondary))" name="Quantidade" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fluxo de Caixa</CardTitle>
            <CardDescription>Entradas e saídas por dia</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="income" fill="hsl(var(--primary))" name="Entradas" />
                <Bar dataKey="expense" fill="hsl(var(--destructive))" name="Saídas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10 Produtos</CardTitle>
            <CardDescription>Produtos mais vendidos por receita</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="title" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Receita" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 Clientes</CardTitle>
            <CardDescription>Clientes que mais compraram no período</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topClients}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="total"
                >
                  {topClients.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
