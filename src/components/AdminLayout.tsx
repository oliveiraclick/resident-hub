import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  showBack?: boolean;
}

const AdminLayout = ({ children, title, showBack = true }: AdminLayoutProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="text-foreground p-1"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 className="text-title-md">{title}</h1>
        </div>
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
};

export default AdminLayout;
