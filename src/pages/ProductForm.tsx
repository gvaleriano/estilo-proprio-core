import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";

interface Client {
  id: string;
  name: string;
}

export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const isEditMode = Boolean(id);
  const [formData, setFormData] = useState({
    sku: "",
    title: "",
    description: "",
    category: "",
    size: "",
    brand: "",
    price: "",
    consigned: false,
    consignor_id: "",
    consignment_percentage: "",
    stock_quantity: "1",
    images: [] as string[],
  });

  useEffect(() => {
    fetchClients();
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("id, name")
      .order("name");

    if (!error && data) {
      setClients(data);
    }
  };

  const fetchProduct = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFormData({
          sku: data.sku || "",
          title: data.title,
          description: data.description || "",
          category: data.category || "",
          size: data.size || "",
          brand: data.brand || "",
          price: data.price.toString(),
          consigned: data.consigned || false,
          consignor_id: data.consignor_id || "",
          consignment_percentage: data.consignment_percentage?.toString() || "",
          stock_quantity: data.stock_quantity?.toString() || "1",
          images: data.images || [],
        });
      }
    } catch (error: any) {
      toast.error("Erro ao carregar produto: " + error.message);
      navigate("/products");
    }
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const productData = {
      sku: formData.sku || null,
      title: formData.title,
      description: formData.description || null,
      category: formData.category || null,
      size: formData.size || null,
      brand: formData.brand || null,
      price: parseFloat(formData.price),
      consigned: formData.consigned,
      consignor_id: formData.consigned && formData.consignor_id ? formData.consignor_id : null,
      consignment_percentage: formData.consigned && formData.consignment_percentage ? parseFloat(formData.consignment_percentage) : null,
      stock_quantity: parseInt(formData.stock_quantity),
      images: formData.images,
    };

    const maxRetries = 3;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Tentativa ${attempt} de ${maxRetries}...`);

        if (isEditMode) {
          const { error } = await supabase
            .from("products")
            .update(productData)
            .eq("id", id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("products")
            .insert([productData]);

          if (error) throw error;
        }

        toast.success(isEditMode ? "Produto atualizado com sucesso!" : "Produto cadastrado com sucesso!");
        navigate("/products");
        return;
      } catch (error: any) {
        lastError = error;
        console.error(`Erro na tentativa ${attempt}:`, error?.message);
        
        if (attempt < maxRetries) {
          console.log(`Aguardando 500ms antes da próxima tentativa...`);
          await delay(500);
        }
      }
    }

    console.error("Todas as tentativas falharam:", lastError);
    toast.error(`Erro ao ${isEditMode ? "atualizar" : "cadastrar"} produto. Verifique sua conexão e tente novamente.`);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/products")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            {isEditMode ? "Editar Produto" : "Novo Produto"}
          </h2>
          <p className="text-muted-foreground">
            {isEditMode ? "Atualize as informações do produto" : "Adicione um novo produto ao estoque"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Produto</CardTitle>
          <CardDescription>
            {isEditMode ? "Atualize os dados do produto" : "Preencha os dados do produto abaixo"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU (opcional)</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Ex: BLU-001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Jaqueta Jeans Vintage"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o produto..."
                rows={3}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Ex: Jaquetas"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Tamanho</Label>
                <Input
                  id="size"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  placeholder="Ex: M, G, 42"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="Ex: Levi's"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock_quantity">Quantidade em Estoque *</Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  required
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  placeholder="1"
                />
              </div>
            </div>

            <ImageUpload
              images={formData.images}
              onImagesChange={(images) => setFormData({ ...formData, images })}
            />

            <div className="flex items-center space-x-2">
              <Switch
                id="consigned"
                checked={formData.consigned}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, consigned: checked, consignor_id: checked ? formData.consignor_id : "" })
                }
              />
              <Label htmlFor="consigned" className="cursor-pointer">
                Produto consignado
              </Label>
            </div>

            {formData.consigned && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="consignor">Consignante *</Label>
                  <Select value={formData.consignor_id} onValueChange={(value) => setFormData({ ...formData, consignor_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o consignante" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="consignment_percentage">Porcentagem para Consignante (%) *</Label>
                  <Input
                    id="consignment_percentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    value={formData.consignment_percentage}
                    onChange={(e) => setFormData({ ...formData, consignment_percentage: e.target.value })}
                    placeholder="Ex: 50"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? (isEditMode ? "Atualizando..." : "Cadastrando...") : (isEditMode ? "Atualizar Produto" : "Cadastrar Produto")}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/products")}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
