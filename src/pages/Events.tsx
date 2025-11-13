import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Send, Calendar as CalendarIcon, Mail, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  created_at: string;
}

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [additionalEmails, setAdditionalEmails] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: new Date(),
  });

  useEffect(() => {
    fetchEvents();
    fetchClients();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar eventos: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, email, phone")
        .order("name");

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar clientes: " + error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("events").insert([
        {
          title: formData.title,
          description: formData.description,
          event_date: formData.event_date.toISOString(),
          created_by: user?.id,
        },
      ]);

      if (error) throw error;

      toast.success("Evento criado com sucesso!");
      setDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        event_date: new Date(),
      });
      fetchEvents();
    } catch (error: any) {
      toast.error("Erro ao criar evento: " + error.message);
    }
  };

  const handleSendInvitations = async () => {
    if (!selectedEvent) return;

    try {
      // Prepare WhatsApp messages
      const whatsappMessages: string[] = [];
      const selectedClientsList = clients.filter(c => selectedClients.includes(c.id));
      
      const message = encodeURIComponent(
        `🎉 *${selectedEvent.title}*\n\n${selectedEvent.description}\n\n📅 Data: ${format(new Date(selectedEvent.event_date), "dd/MM/yyyy 'às' HH:mm")}\n\nContamos com sua presença!`
      );

      selectedClientsList.forEach((client) => {
        if (client.phone) {
          const phone = client.phone.replace(/\D/g, '');
          const whatsappUrl = `https://wa.me/55${phone}?text=${message}`;
          whatsappMessages.push(`${client.name}: ${whatsappUrl}`);
          
          // Open WhatsApp link
          window.open(whatsappUrl, '_blank');
        }
      });

      // Save invitations to database
      const invitations = selectedClientsList.map(client => ({
        event_id: selectedEvent.id,
        client_id: client.id,
        phone: client.phone,
        email: client.email,
      }));

      if (invitations.length > 0) {
        const { error } = await supabase
          .from("event_invitations")
          .insert(invitations);

        if (error) throw error;
      }

      // Handle additional emails
      if (additionalEmails.trim()) {
        const emails = additionalEmails.split(',').map(e => e.trim()).filter(e => e);
        const emailInvitations = emails.map(email => ({
          event_id: selectedEvent.id,
          email: email,
        }));

        if (emailInvitations.length > 0) {
          const { error } = await supabase
            .from("event_invitations")
            .insert(emailInvitations);

          if (error) throw error;
        }

        // Create mailto link for additional emails
        const emailSubject = encodeURIComponent(selectedEvent.title);
        const emailBody = encodeURIComponent(
          `${selectedEvent.description}\n\nData: ${format(new Date(selectedEvent.event_date), "dd/MM/yyyy 'às' HH:mm")}\n\nContamos com sua presença!`
        );
        const mailtoLink = `mailto:${emails.join(',')}?subject=${emailSubject}&body=${emailBody}`;
        window.open(mailtoLink, '_blank');
      }

      toast.success(
        `Convites enviados! ${whatsappMessages.length} via WhatsApp${additionalEmails ? ' e emails abertos para envio' : ''}`
      );
      
      setSendDialogOpen(false);
      setSelectedClients([]);
      setAdditionalEmails("");
    } catch (error: any) {
      toast.error("Erro ao enviar convites: " + error.message);
    }
  };

  const toggleClient = (clientId: string) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Eventos</h1>
          <p className="text-muted-foreground">Gerencie eventos e envie convites para clientes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Evento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Evento</DialogTitle>
              <DialogDescription>Preencha as informações do evento</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div>
                <Label>Data do Evento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.event_date, "dd/MM/yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.event_date}
                      onSelect={(date) => date && setFormData({ ...formData, event_date: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <DialogFooter>
                <Button type="submit">Criar Evento</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Eventos Cadastrados</CardTitle>
          <CardDescription>Lista de todos os eventos</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : events.length === 0 ? (
            <p className="text-muted-foreground">Nenhum evento cadastrado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Data do Evento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => {
                  const isPast = new Date(event.event_date) < new Date();
                  return (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.title}</TableCell>
                      <TableCell>{format(new Date(event.event_date), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="max-w-xs truncate">{event.description}</TableCell>
                      <TableCell>
                        <Badge variant={isPast ? "secondary" : "default"}>
                          {isPast ? "Realizado" : "Próximo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedEvent(event);
                            setSendDialogOpen(true);
                          }}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Enviar Convites
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Send Invitations Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enviar Convites - {selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              Selecione os clientes que receberão o convite via WhatsApp
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold mb-4 flex items-center">
                <MessageCircle className="mr-2 h-5 w-5" />
                Clientes Cadastrados (WhatsApp)
              </Label>
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-4">
                {clients.filter(c => c.phone).map((client) => (
                  <div key={client.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={client.id}
                      checked={selectedClients.includes(client.id)}
                      onCheckedChange={() => toggleClient(client.id)}
                    />
                    <label
                      htmlFor={client.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {client.name} - {client.phone}
                    </label>
                  </div>
                ))}
                {clients.filter(c => c.phone).length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum cliente com telefone cadastrado</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="additionalEmails" className="text-base font-semibold mb-2 flex items-center">
                <Mail className="mr-2 h-5 w-5" />
                Emails Adicionais
              </Label>
              <Textarea
                id="additionalEmails"
                placeholder="Digite emails separados por vírgula (ex: email1@example.com, email2@example.com)"
                value={additionalEmails}
                onChange={(e) => setAdditionalEmails(e.target.value)}
                rows={3}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Para enviar emails para pessoas não cadastradas
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleSendInvitations}
              disabled={selectedClients.length === 0 && !additionalEmails.trim()}
            >
              <Send className="mr-2 h-4 w-4" />
              Enviar Convites
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
