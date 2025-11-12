import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Plus } from "lucide-react";
import { toast } from "sonner";

type CashFlowEntry = {
  id: string;
  type: "in" | "out";
  amount: number;
  category: string;
  reference: string | null;
  created_at: string;
};

export default function Cash() {
  const [entries, setEntries] = useState<CashFlowEntry[]>([]);
  const [balance, setBalance] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "in" as "in" | "out",
    amount: "",
    category: "",
    reference: "",
  });

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    const { data, error } = await supabase
      .from("cash_flow")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar fluxo de caixa");
      return;
    }

    setEntries(data || []);
    
    const totalBalance = (data || []).reduce((sum, entry) => {
      return entry.type === "in" ? sum + Number(entry.amount) : sum - Number(entry.amount);
    }, 0);
    setBalance(totalBalance);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || !formData.category) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const { error } = await supabase.from("cash_flow").insert({
      type: formData.type,
      amount: parseFloat(formData.amount),
      category: formData.category,
      reference: formData.reference || null,
    });

    if (error) {
      toast.error("Erro ao adicionar entrada: " + error.message);
      return;
    }

    toast.success("Entrada adicionada com sucesso!");
    setIsDialogOpen(false);
    setFormData({ type: "in", amount: "", category: "", reference: "" });
    fetchEntries();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Caixa</h2>
          <p className="text-muted-foreground">Gestão de fluxo de caixa</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Entrada
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Entrada de Caixa</DialogTitle>
              <DialogDescription>Adicione uma nova movimentação financeira</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={formData.type} onValueChange={(value: "in" | "out") => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Entrada</SelectItem>
                    <SelectItem value="out">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Ex: Venda, Aluguel, Fornecedor"
                />
              </div>
              <div className="space-y-2">
                <Label>Referência (opcional)</Label>
                <Textarea
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  placeholder="Descrição adicional"
                />
              </div>
              <Button type="submit" className="w-full">Adicionar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Saldo Atual</CardTitle>
          <CardDescription>Balanço total do fluxo de caixa</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`text-4xl font-bold ${balance >= 0 ? "text-success" : "text-destructive"}`}>
            R$ {balance.toFixed(2)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Movimentações</CardTitle>
          <CardDescription>Todas as entradas e saídas registradas</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Referência</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhuma movimentação registrada
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      {new Date(entry.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={entry.type === "in" ? "default" : "secondary"}>
                        {entry.type === "in" ? (
                          <>
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Entrada
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-3 w-3 mr-1" />
                            Saída
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>{entry.category}</TableCell>
                    <TableCell className="max-w-xs truncate">{entry.reference || "-"}</TableCell>
                    <TableCell className={`text-right font-medium ${entry.type === "in" ? "text-success" : "text-destructive"}`}>
                      {entry.type === "in" ? "+" : "-"}R$ {Number(entry.amount).toFixed(2)}
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
