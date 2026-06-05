import { RefreshCw, X } from "lucide-react";
import { useUpdateChecker } from "@/hooks/useUpdateChecker";

const UpdateBanner = () => {
  const { updateAvailable, applyUpdate } = useUpdateChecker();

  useEffect(() => {
    if (updateAvailable) {
      // Force update immediately if it's a web update
      applyUpdate();
    }
  }, [updateAvailable, applyUpdate]);

  return null;
};

export default UpdateBanner;
