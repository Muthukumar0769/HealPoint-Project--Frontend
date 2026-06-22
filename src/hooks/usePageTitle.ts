import { useEffect } from "react";

const usePageTitle = (title: string) => {
  useEffect(() => {
    document.title = `${title} – HealPoint`;
    return () => {
      document.title = "HealPoint";
    };
  }, [title]);
};

export default usePageTitle;