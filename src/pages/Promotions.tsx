import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Promotions() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Promoções</h2>
        <p className="text-muted-foreground">Gerencie promoções e ofertas especiais</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Promoções Ativas</CardTitle>
          <CardDescription>Configure e monitore promoções</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Funcionalidade em desenvolvimento</p>
        </CardContent>
      </Card>
    </div>
  );
}
