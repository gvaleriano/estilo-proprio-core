import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Pencil, Trash2, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";

interface Product {
  id: string;
  sku: string | null;
  title: string;
  description: string | null;
  category: string | null;
  size: string | null;
  brand: string | null;
  price: number;
  stock_quantity: number;
  status: string;
  consigned: boolean;
  consignment_percentage: number | null;
  consignor_id: string | null;
  images: string[] | null;
  created_at: string;
  consignor?: {
    name: string;
  };
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          consignor:clients(name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalProducts = filteredProducts.length;
  const totalPages = Math.ceil(totalProducts / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when search or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const handleDeleteClick = (productId: string) => {
    setProductToDelete(productId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productToDelete);

      if (error) throw error;

      toast.success("Produto excluído com sucesso!");
      fetchProducts();
    } catch (error: any) {
      toast.error("Erro ao excluir produto: " + error.message);
    } finally {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      available: { label: "Disponível", variant: "default" as const },
      reserved: { label: "Reservado", variant: "secondary" as const },
      sold: { label: "Vendido", variant: "outline" as const },
      damaged: { label: "Danificado", variant: "destructive" as const },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.available;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink
            isActive={currentPage === i}
            onClick={() => setCurrentPage(i)}
            className="cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    return pages;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Produtos</h2>
          <p className="text-muted-foreground">Gerencie o estoque do seu brechó</p>
        </div>
        <Button onClick={() => navigate("/products/new")} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, SKU ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Total: <strong>{totalProducts}</strong> produtos</span>
            <Select value={String(itemsPerPage)} onValueChange={(v) => setItemsPerPage(Number(v))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando produtos...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? "Nenhum produto encontrado" : "Nenhum produto cadastrado ainda"}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Consignado</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">{product.sku || "-"}</TableCell>
                    <TableCell className="font-medium">{product.title}</TableCell>
                    <TableCell>{product.category || "-"}</TableCell>
                    <TableCell>R$ {Number(product.price).toFixed(2)}</TableCell>
                    <TableCell>{product.stock_quantity}</TableCell>
                    <TableCell>{getStatusBadge(product.status)}</TableCell>
                    <TableCell>
                      {product.consigned ? (
                        <Badge variant="secondary">
                          Sim {product.consignment_percentage && `(${product.consignment_percentage}%)`}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Não</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.consigned && product.consignor ? (
                        <span className="text-sm">{product.consignor.name}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDetailProduct(product)}
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/products/edit/${product.id}`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(product.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {renderPageNumbers()}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Product Detail Modal */}
      <Dialog open={!!detailProduct} onOpenChange={(open) => !open && setDetailProduct(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Produto</DialogTitle>
          </DialogHeader>
          {detailProduct && (
            <div className="space-y-4">
              {detailProduct.images && detailProduct.images.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {detailProduct.images.map((img, i) => (
                    <img key={i} src={img} alt={detailProduct.title} className="h-24 w-24 object-cover rounded-md border" />
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">SKU</span>
                  <p className="font-medium">{detailProduct.sku || "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Título</span>
                  <p className="font-medium">{detailProduct.title}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Descrição</span>
                  <p className="font-medium">{detailProduct.description || "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Categoria</span>
                  <p className="font-medium">{detailProduct.category || "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tamanho</span>
                  <p className="font-medium">{detailProduct.size || "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Marca</span>
                  <p className="font-medium">{detailProduct.brand || "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Preço</span>
                  <p className="font-medium">R$ {Number(detailProduct.price).toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Estoque</span>
                  <p className="font-medium">{detailProduct.stock_quantity}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status</span>
                  <p>{getStatusBadge(detailProduct.status)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Consignado</span>
                  <p className="font-medium">{detailProduct.consigned ? "Sim" : "Não"}</p>
                </div>
                {detailProduct.consigned && (
                  <>
                    <div>
                      <span className="text-muted-foreground">Consignante</span>
                      <p className="font-medium">{detailProduct.consignor?.name || "-"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">% Consignação</span>
                      <p className="font-medium">{detailProduct.consignment_percentage}%</p>
                    </div>
                  </>
                )}
                <div>
                  <span className="text-muted-foreground">Cadastrado em</span>
                  <p className="font-medium">{new Date(detailProduct.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
