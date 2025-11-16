import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, TrendingUp, DollarSign, Users, Package, Download, FileText } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

interface StockMovement {
  id: string;
  created_at: string;
  type: string;
  quantity: number;
  reason: string | null;
  product_title: string;
  consigned: boolean;
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
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
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

      // Fetch stock movements
      const { data: movements, error: movementsError } = await supabase
        .from("stock_movements")
        .select(`
          id,
          created_at,
          type,
          quantity,
          reason,
          product_id,
          products (
            title,
            consigned
          )
        `)
        .gte("created_at", fromDate)
        .lte("created_at", toDate)
        .order("created_at", { ascending: false });

      if (movementsError) throw movementsError;

      setStockMovements(
        movements?.map((m: any) => ({
          id: m.id,
          created_at: m.created_at,
          type: m.type,
          quantity: m.quantity,
          reason: m.reason,
          product_title: m.products?.title || "Produto desconhecido",
          consigned: m.products?.consigned || false,
        })) || []
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

  const exportToCSV = () => {
    try {
      const csvData = [
        ["Resumo do Período"],
        ["Receita Total", `R$ ${summary.totalRevenue.toFixed(2)}`],
        ["Total de Vendas", summary.totalSales.toString()],
        ["Ticket Médio", `R$ ${summary.avgTicket.toFixed(2)}`],
        ["Total de Clientes", summary.totalClients.toString()],
        [""],
        ["Vendas por Dia"],
        ["Data", "Total (R$)", "Quantidade"],
        ...salesByDay.map(item => [item.date, item.total.toFixed(2), item.count.toString()]),
        [""],
        ["Top 10 Produtos"],
        ["Produto", "Quantidade", "Receita (R$)"],
        ...topProducts.map(item => [item.title, item.quantity.toString(), item.revenue.toFixed(2)]),
        [""],
        ["Top Clientes"],
        ["Cliente", "Compras", "Total (R$)"],
        ...topClients.map(item => [item.name, item.purchases.toString(), item.total.toFixed(2)]),
        [""],
        ["Movimentação de Estoque"],
        ["Produto", "Data", "Tipo", "Quantidade", "Motivo", "Consignado"],
        ...stockMovements.map(m => [
          m.product_title,
          format(new Date(m.created_at), "dd/MM/yyyy HH:mm"),
          m.type === "in" ? "Entrada" : m.type === "out" ? "Saída" : m.type,
          m.quantity.toString(),
          m.reason || "-",
          m.consigned ? "Sim" : "Não"
        ]),
      ];

      const csv = csvData.map(row => row.join(";")).join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `relatorio_${format(dateRange?.from || new Date(), "dd-MM-yyyy")}_${format(dateRange?.to || new Date(), "dd-MM-yyyy")}.csv`;
      link.click();
      toast.success("Relatório exportado para CSV");
    } catch (error: any) {
      toast.error("Erro ao exportar CSV: " + error.message);
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(18);
      doc.text("Relatório de Vendas", 14, 20);
      
      // Period
      doc.setFontSize(11);
      doc.text(`Período: ${format(dateRange?.from || new Date(), "dd/MM/yyyy")} - ${format(dateRange?.to || new Date(), "dd/MM/yyyy")}`, 14, 30);
      
      // Summary
      doc.setFontSize(14);
      doc.text("Resumo", 14, 40);
      doc.setFontSize(10);
      doc.text(`Receita Total: R$ ${summary.totalRevenue.toFixed(2)}`, 14, 48);
      doc.text(`Total de Vendas: ${summary.totalSales}`, 14, 55);
      doc.text(`Ticket Médio: R$ ${summary.avgTicket.toFixed(2)}`, 14, 62);
      doc.text(`Total de Clientes: ${summary.totalClients}`, 14, 69);
      
      // Top Products Table
      autoTable(doc, {
        startY: 80,
        head: [["Top 10 Produtos", "Quantidade", "Receita (R$)"]],
        body: topProducts.map(item => [
          item.title,
          item.quantity.toString(),
          `R$ ${item.revenue.toFixed(2)}`
        ]),
        theme: "grid",
        headStyles: { fillColor: [99, 102, 241] },
      });
      
      // Top Clients Table
      let finalY = (doc as any).lastAutoTable.finalY || 80;
      autoTable(doc, {
        startY: finalY + 10,
        head: [["Top Clientes", "Compras", "Total (R$)"]],
        body: topClients.slice(0, 5).map(item => [
          item.name,
          item.purchases.toString(),
          `R$ ${item.total.toFixed(2)}`
        ]),
        theme: "grid",
        headStyles: { fillColor: [99, 102, 241] },
      });

      // Stock Movements Table
      finalY = (doc as any).lastAutoTable.finalY || 80;
      autoTable(doc, {
        startY: finalY + 10,
        head: [["Movimentação de Estoque", "Data", "Tipo", "Qtd", "Consignado"]],
        body: stockMovements.slice(0, 20).map(item => [
          item.product_title,
          format(new Date(item.created_at), "dd/MM/yyyy HH:mm"),
          item.type === "in" ? "Entrada" : item.type === "out" ? "Saída" : item.type,
          item.quantity.toString(),
          item.consigned ? "Sim" : "Não"
        ]),
        theme: "grid",
        headStyles: { fillColor: [99, 102, 241] },
      });
      
      doc.save(`relatorio_${format(dateRange?.from || new Date(), "dd-MM-yyyy")}_${format(dateRange?.to || new Date(), "dd-MM-yyyy")}.pdf`);
      toast.success("Relatório exportado para PDF");
    } catch (error: any) {
      toast.error("Erro ao exportar PDF: " + error.message);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios Avançados</h1>
          <p className="text-muted-foreground">Análise completa do desempenho da loja</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={exportToCSV}>
            <FileText className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <Button variant="outline" onClick={exportToPDF}>
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
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

      {/* Stock Movements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentação de Estoque</CardTitle>
          <CardDescription>Histórico de entradas e saídas de produtos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Produto</th>
                  <th className="text-left p-2 font-medium">Data</th>
                  <th className="text-left p-2 font-medium">Tipo</th>
                  <th className="text-right p-2 font-medium">Quantidade</th>
                  <th className="text-left p-2 font-medium">Motivo</th>
                  <th className="text-center p-2 font-medium">Consignado</th>
                </tr>
              </thead>
              <tbody>
                {stockMovements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-muted-foreground">
                      Nenhuma movimentação no período
                    </td>
                  </tr>
                ) : (
                  stockMovements.map((movement) => (
                    <tr key={movement.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">{movement.product_title}</td>
                      <td className="p-2 text-sm text-muted-foreground">
                        {format(new Date(movement.created_at), "dd/MM/yyyy HH:mm")}
                      </td>
                      <td className="p-2">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            movement.type === "in"
                              ? "bg-primary/10 text-primary"
                              : movement.type === "out"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {movement.type === "in" ? "Entrada" : movement.type === "out" ? "Saída" : movement.type}
                        </span>
                      </td>
                      <td className="p-2 text-right font-medium">{movement.quantity}</td>
                      <td className="p-2 text-sm text-muted-foreground">{movement.reason || "-"}</td>
                      <td className="p-2 text-center">
                        {movement.consigned ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary/50 text-secondary-foreground">
                            Sim
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">Não</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
