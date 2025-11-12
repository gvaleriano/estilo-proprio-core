import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Tag } from "lucide-react";
import { toast } from "sonner";

type Promotion = {
  id: string;
  name: string;
  type: "percent" | "fixed" | "bundle";
  value: number | null;
  conditions: any;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
};

export default function Promotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "percent" as "percent" | "fixed" | "bundle",
    value: "",
    starts_at: "",
    ends_at: "",
  });

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    const { data, error } = await supabase
      .from("promotions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar promoções");
      return;
    }

    setPromotions(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.value) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const { error } = await supabase.from("promotions").insert({
      name: formData.name,
      type: formData.type,
      value: parseFloat(formData.value),
      starts_at: formData.starts_at || null,
      ends_at: formData.ends_at || null,
      active: true,
    });

    if (error) {
      toast.error("Erro ao criar promoção: " + error.message);
      return;
    }

    toast.success("Promoção criada com sucesso!");
    setIsDialogOpen(false);
    setFormData({ name: "", type: "percent", value: "", starts_at: "", ends_at: "" });
    fetchPromotions();
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("promotions")
      .update({ active: !currentStatus })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao atualizar promoção");
      return;
    }

    toast.success("Promoção atualizada!");
    fetchPromotions();
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      percent: "Desconto %",
      fixed: "Desconto Fixo",
      bundle: "Leve X Pague Y",
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Promoções</h2>
          <p className="text-muted-foreground">Gerencie promoções e ofertas especiais</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Promoção
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Promoção</DialogTitle>
              <DialogDescription>Crie uma nova promoção para seus produtos</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da Promoção</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Black Friday"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Desconto Percentual</SelectItem>
                    <SelectItem value="fixed">Desconto Fixo</SelectItem>
                    <SelectItem value="bundle">Leve X Pague Y</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor {formData.type === "percent" ? "(%)" : "(R$)"}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder={formData.type === "percent" ? "10" : "50.00"}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data Início</Label>
                  <Input
                    type="datetime-local"
                    value={formData.starts_at}
                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Fim</Label>
                  <Input
                    type="datetime-local"
                    value={formData.ends_at}
                    onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">Criar Promoção</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Promoções Cadastradas</CardTitle>
          <CardDescription>Gerencie suas promoções ativas e inativas</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ativa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhuma promoção cadastrada
                  </TableCell>
                </TableRow>
              ) : (
                promotions.map((promo) => (
                  <TableRow key={promo.id}>
                    <TableCell className="font-medium">{promo.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        <Tag className="h-3 w-3 mr-1" />
                        {getTypeLabel(promo.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {promo.type === "percent" ? `${promo.value}%` : `R$ ${promo.value}`}
                    </TableCell>
                    <TableCell className="text-sm">
                      {promo.starts_at ? new Date(promo.starts_at).toLocaleDateString("pt-BR") : "-"}
                      {" até "}
                      {promo.ends_at ? new Date(promo.ends_at).toLocaleDateString("pt-BR") : "∞"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={promo.active ? "default" : "secondary"}>
                        {promo.active ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={promo.active}
                        onCheckedChange={() => toggleActive(promo.id, promo.active)}
                      />
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
