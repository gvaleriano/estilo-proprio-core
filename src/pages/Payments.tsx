import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditCard, DollarSign, Smartphone, QrCode } from "lucide-react";
import { toast } from "sonner";

type Sale = {
  id: string;
  order_number: string;
  total: number;
  payment_method: string | null;
  payment_status: string;
  payment_reference: string | null;
  created_at: string;
};

export default function Payments() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [pixValue, setPixValue] = useState("");
  const [pixCode, setPixCode] = useState("");

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      toast.error("Erro ao carregar pagamentos");
      return;
    }

    setSales(data || []);
  };

  const generatePixCode = () => {
    if (!pixValue || parseFloat(pixValue) <= 0) {
      toast.error("Digite um valor válido");
      return;
    }

    // Simulação de geração de código PIX (em produção, integrar com API de pagamento)
    const mockPixCode = `00020126580014br.gov.bcb.pix0136${Math.random().toString(36).substring(2, 38)}520400005303986540${parseFloat(pixValue).toFixed(2)}5802BR5925ESTILO PROPRIO BRECHO6009SAO PAULO62070503***6304${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    setPixCode(mockPixCode);
    toast.success("Código PIX gerado!");
  };

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCode);
    toast.success("Código PIX copiado!");
  };

  const getPaymentMethodIcon = (method: string | null) => {
    switch (method) {
      case "card":
        return <CreditCard className="h-4 w-4" />;
      case "pix":
        return <Smartphone className="h-4 w-4" />;
      case "cash":
        return <DollarSign className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getPaymentMethodLabel = (method: string | null) => {
    const labels: Record<string, string> = {
      card: "Cartão",
      pix: "PIX",
      cash: "Dinheiro",
      other: "Outro",
    };
    return labels[method || ""] || method || "N/A";
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      paid: "default",
      pending: "secondary",
      failed: "destructive",
    };
    
    const labels: Record<string, string> = {
      paid: "Pago",
      pending: "Pendente",
      failed: "Falhou",
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Pagamentos</h2>
        <p className="text-muted-foreground">Gestão de pagamentos e QR Code Pix</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Gerar PIX
            </CardTitle>
            <CardDescription>Crie um código PIX para recebimento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                type="number"
                step="0.01"
                placeholder="Valor (R$)"
                value={pixValue}
                onChange={(e) => setPixValue(e.target.value)}
              />
              <Button onClick={generatePixCode} className="w-full">
                Gerar Código PIX
              </Button>
            </div>

            {pixCode && (
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">Código PIX gerado:</p>
                <div className="bg-background p-3 rounded border break-all text-xs font-mono">
                  {pixCode}
                </div>
                <Button onClick={copyPixCode} variant="outline" className="w-full" size="sm">
                  Copiar Código
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Cliente pode copiar e colar no app do banco
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo de Pagamentos</CardTitle>
            <CardDescription>Estatísticas de hoje</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-success" />
                  <span className="text-sm">Total Pago</span>
                </div>
                <span className="font-bold text-success">
                  R$ {sales.filter(s => s.payment_status === "paid").reduce((sum, s) => sum + Number(s.total), 0).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-warning" />
                  <span className="text-sm">Pendente</span>
                </div>
                <span className="font-bold text-warning">
                  R$ {sales.filter(s => s.payment_status === "pending").reduce((sum, s) => sum + Number(s.total), 0).toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
          <CardDescription>Últimas 50 transações</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Referência</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhum pagamento registrado
                  </TableCell>
                </TableRow>
              ) : (
                sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">#{sale.order_number}</TableCell>
                    <TableCell>
                      {new Date(sale.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(sale.payment_method)}
                        <span>{getPaymentMethodLabel(sale.payment_method)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">R$ {Number(sale.total).toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(sale.payment_status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {sale.payment_reference || "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
