import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, ShoppingCart, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Product {
  id: string;
  title: string;
  price: number;
  stock_quantity: number;
  consigned: boolean;
  consignor_id: string | null;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface Client {
  id: string;
  name: string;
}

export default function Sales() {
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchClients();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("status", "available")
      .gt("stock_quantity", 0)
      .order("title");

    if (!error && data) {
      setProducts(data);
    }
  };

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("id, name")
      .order("name");

    if (!error && data) {
      setClients(data);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);

    if (existingItem) {
      if (existingItem.quantity >= product.stock_quantity) {
        toast.error("Quantidade máxima em estoque atingida");
        return;
      }
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    toast.success("Produto adicionado ao carrinho");
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const item = cart.find((item) => item.product.id === productId);
    if (!item) return;

    if (quantity > item.product.stock_quantity) {
      toast.error("Quantidade excede o estoque disponível");
      return;
    }

    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(
      cart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const calculateSubtotal = () => {
    return cart.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0
    );
  };

  const processSale = async () => {
    if (cart.length === 0) {
      toast.error("Carrinho vazio");
      return;
    }

    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.error("Sessão expirada. Por favor, faça login novamente.");
        return;
      }

      const subtotal = calculateSubtotal();
      const orderNumber = `PD-${Date.now()}`;

      const saleItems = cart.map((item) => ({
        product_id: item.product.id,
        price: item.product.price,
        qty: item.quantity,
      }));

      // Insert sale
      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .insert([{
          order_number: orderNumber,
          client_id: selectedClientId || null,
          seller_id: user.id,
          items: saleItems,
          subtotal,
          discount: 0,
          total: subtotal,
          payment_method: paymentMethod as "cash" | "pix" | "card" | "other",
          payment_status: "paid",
        }])
        .select()
        .single();

      if (saleError) {
        console.error("Erro ao criar venda:", saleError);
        throw new Error("Falha ao registrar venda");
      }

      // Create stock movements in parallel
      const stockMovementPromises = cart.map((item) =>
        supabase.from("stock_movements").insert({
          product_id: item.product.id,
          type: "out",
          quantity: item.quantity,
          reason: "Venda",
          reference_id: saleData.id,
        })
      );

      const movementResults = await Promise.all(stockMovementPromises);
      const movementErrors = movementResults.filter(r => r.error);
      if (movementErrors.length > 0) {
        console.error("Erros ao criar movimentos:", movementErrors);
      }

      // Update product stock in parallel
      const stockUpdatePromises = cart.map((item) => {
        const newStock = item.product.stock_quantity - item.quantity;
        return supabase
          .from("products")
          .update({
            stock_quantity: newStock,
            status: newStock === 0 ? "sold" : "available",
          })
          .eq("id", item.product.id);
      });

      const updateResults = await Promise.all(stockUpdatePromises);
      const updateErrors = updateResults.filter(r => r.error);
      if (updateErrors.length > 0) {
        console.error("Erros ao atualizar estoque:", updateErrors);
      }

      // Create cash flow entry
      await supabase.from("cash_flow").insert({
        type: "in",
        amount: subtotal,
        category: "Venda",
        reference: orderNumber,
        related_sale_id: saleData.id,
      });

      toast.success("Venda realizada com sucesso!");
      setCart([]);
      setSelectedClientId(undefined);
      fetchProducts();
    } catch (error: any) {
      console.error("Erro ao processar venda:", error);
      toast.error(error.message || "Erro ao processar venda. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Ponto de Venda</h2>
        <p className="text-muted-foreground">Registre vendas e gerencie o carrinho</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Products List */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos Disponíveis</CardTitle>
            <CardDescription>Clique para adicionar ao carrinho</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="max-h-[500px] overflow-y-auto space-y-2">
              {filteredProducts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum produto disponível
                </p>
              ) : (
                filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => addToCart(product)}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{product.title}</p>
                      <div className="flex gap-2 items-center mt-1">
                        <p className="text-sm text-muted-foreground">
                          Estoque: {product.stock_quantity}
                        </p>
                        {product.consigned && (
                          <Badge variant="secondary" className="text-xs">
                            Consignado
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        R$ {Number(product.price).toFixed(2)}
                      </p>
                      <Button size="sm" variant="ghost" className="mt-1">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Shopping Cart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Carrinho
            </CardTitle>
            <CardDescription>
              {cart.length} {cart.length === 1 ? "item" : "itens"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>Carrinho vazio</p>
              </div>
            ) : (
              <>
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.product.title}</p>
                        <p className="text-sm text-muted-foreground">
                          R$ {Number(item.product.price).toFixed(2)} cada
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          max={item.product.stock_quantity}
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(item.product.id, parseInt(e.target.value) || 1)
                          }
                          className="w-16 text-center"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="space-y-2">
                    <Label>Cliente (opcional)</Label>
                    <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
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
                    <Label>Método de Pagamento</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Dinheiro</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="card">Cartão</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-primary">R$ {calculateSubtotal().toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={processSale}
                    disabled={loading || cart.length === 0}
                  >
                    {loading ? "Processando..." : "Finalizar Venda"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
