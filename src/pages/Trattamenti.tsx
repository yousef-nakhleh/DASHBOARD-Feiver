import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Pencil, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ServicesTable() {
  const [services, setServices] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchServices = async () => {
      const { data, error } = await supabase.from("services").select("*");
      if (!error) setServices(data);
    };
    fetchServices();
  }, []);

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const categories = ["Tutti", ...Array.from(new Set(services.map((s) => s.category).filter(Boolean)))];
  const [selectedCategory, setSelectedCategory] = useState("Tutti");

  const displayedServices = filteredServices.filter(
    (s) => selectedCategory === "Tutti" || s.category === selectedCategory
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Trattamenti</h1>
      <p className="text-muted-foreground mb-4">Gestisci servizi e prezzi</p>

      <div className="mb-4">
        <Input
          placeholder="Cerca trattamento"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-4">
        <TabsList className="flex gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <TabsTrigger key={cat} value={cat} className="capitalize whitespace-nowrap">
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="border rounded-md overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-muted text-left">
              <th className="p-3 font-medium">TRATTAMENTO</th>
              <th className="p-3 font-medium">DURATA</th>
              <th className="p-3 font-medium">PREZZO</th>
              <th className="p-3 font-medium">CATEGORIA</th>
              <th className="p-3 font-medium">POPOLARE</th>
              <th className="p-3 font-medium">AZIONI</th>
            </tr>
          </thead>
          <tbody>
            {displayedServices.length > 0 ? (
              displayedServices.map((service) => (
                <tr key={service.id} className="border-t">
                  <td className="p-3">{service.name}</td>
                  <td className="p-3">{service.duration_min} min</td>
                  <td className="p-3">
                    {service.price ? `€${service.price}` : <span className="text-muted-foreground">-</span>}
                  </td>
                  <td className="p-3">
                    {service.category ? (
                      <Badge variant="outline">{service.category}</Badge>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </td>
                  <td className="p-3">
                    {service.is_popular ? (
                      <Badge>Si</Badge>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </td>
                  <td className="p-3 flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-4 text-center text-muted-foreground">
                  Nessun trattamento trovato.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-right">
        <Button className="bg-primary">+ Nuovo Trattamento</Button>
      </div>
    </div>
  );
}