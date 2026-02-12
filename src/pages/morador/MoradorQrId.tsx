import { useAuth } from "@/hooks/useAuth";
import MoradorLayout from "@/components/MoradorLayout";
import QrDisplay from "@/components/QrDisplay";
import { Card, CardContent } from "@/components/ui/card";

const MoradorQrId = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <MoradorLayout title="Meu QR ID" showBack>
      <div className="flex flex-col gap-4 max-w-md mx-auto items-center">
        <Card className="w-full">
          <CardContent className="flex flex-col items-center gap-4 p-6">
            {/* Avatar */}
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <span className="text-title-lg text-primary">
                {(user.user_metadata?.nome as string)?.charAt(0)?.toUpperCase() || "M"}
              </span>
            </div>

            <div className="text-center">
              <p className="text-title-md">
                {(user.user_metadata?.nome as string) || "Morador"}
              </p>
              <p className="text-subtitle text-muted-foreground">{user.email}</p>
            </div>

            <div className="w-full border-t border-border pt-4">
              <QrDisplay value={user.id} label="Apresente este QR na retirada" size={200} />
            </div>
          </CardContent>
        </Card>

        <p className="text-label text-muted-foreground text-center px-4">
          Este QR code é sua identificação pessoal. Use na portaria para retirar encomendas.
        </p>
      </div>
    </MoradorLayout>
  );
};

export default MoradorQrId;
