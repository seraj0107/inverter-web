import { useAuth } from "../../auth/hooks/useAuth.js";
import { getPortalTheme } from "../constants/portalTheme.js";

export function usePortalTheme() {
    const { user } = useAuth();
    return getPortalTheme(user?.version_type);
}
