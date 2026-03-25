import { usePageView } from "@/hooks/usePageView";
import { useErrorTracker } from "@/hooks/useErrorTracker";

const AppTrackers = () => {
  usePageView();
  useErrorTracker();
  return null;
};

export default AppTrackers;
