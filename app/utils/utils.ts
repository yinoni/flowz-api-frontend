import { jwtDecode } from "jwt-decode";

export function safeJwtDecode(token: string) {
    try {
        return jwtDecode(token);
    } catch (error) {
        // אם הטוקן לא בנוי טוב, נתפוס את השגיאה ונחזיר undefined
        return undefined; 
    }
}