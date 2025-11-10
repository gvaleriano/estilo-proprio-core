import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Users, DollarSign, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalClients: 0,
    todaySales: 0,
    lowStock: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Total products
      const { count: productsCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      // Total clients
      const { count: clientsCount } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true });

      // Today's sales
      const today = new Date().toISOString().split("T")[0];
      const { data: salesData } = await supabase
        .from("sales")
        .select("total")
        .gte("created_at", today)
        .eq("payment_status", "paid");

      const todayTotal = salesData?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0;

      // Low stock products (quantity <= 2)
      const { count: lowStockCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .lte("stock_quantity", 2)
        .eq("status", "available");

      setStats({
        totalProducts: productsCount || 0,
        totalClients: clientsCount || 0,
        todaySales: todayTotal,
        lowStock: lowStockCount || 0,
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
    }
  };

  const kpiCards = [
    {
      title: "Total de Produtos",
      value: stats.totalProducts,
      description: "Produtos cadastrados",
      icon: Package,
      color: "text-primary",
    },
    {
      title: "Total de Clientes",
      value: stats.totalClients,
      description: "Clientes cadastrados",
      icon: Users,
      color: "text-secondary",
    },
    {
      title: "Vendas Hoje",
      value: `R$ ${stats.todaySales.toFixed(2)}`,
      description: "Total de vendas hoje",
      icon: DollarSign,
      color: "text-success",
    },
    {
      title: "Estoque Baixo",
      value: stats.lowStock,
      description: "Produtos com estoque ≤ 2",
      icon: TrendingUp,
      color: "text-warning",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
        <p className="text-muted-foreground">Visão geral do seu brechó</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo ao Estilo Próprio Brechó!</CardTitle>
          <CardDescription>
            Sistema completo de gestão para o seu brechó com consignação, estoque, caixa e muito mais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Use o menu lateral para navegar entre as funcionalidades do sistema. 
            Cadastre produtos, gerencie clientes, registre vendas e acompanhe seu caixa em tempo real.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
