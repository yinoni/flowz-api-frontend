import { jwtDecode } from "jwt-decode";

export function safeJwtDecode(token: string) {
    try {
        return jwtDecode(token);
    } catch (error) {
        // אם הטוקן לא בנוי טוב, נתפוס את השגיאה ונחזיר undefined
        return undefined;
    }
}

const HTTP_METHOD_COLORS: Record<string, { text: string; bg: string }> = {
  GET:    { text: "text-green-400",  bg: "bg-green-500/15"  },
  POST:   { text: "text-yellow-400", bg: "bg-yellow-500/15" },
  PUT:    { text: "text-purple-400", bg: "bg-purple-500/15" },
  PATCH:  { text: "text-pink-400",   bg: "bg-pink-500/15"   },
  DELETE: { text: "text-red-400",    bg: "bg-red-500/15"    },
};

export function getHttpMethodColor(method: string): { text: string; bg: string } {
  return HTTP_METHOD_COLORS[method?.toUpperCase()] ?? { text: "text-primary", bg: "bg-primary-container/15" };
}