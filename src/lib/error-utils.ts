/**
 * Maps database/API errors to user-friendly messages.
 * Never expose internal details to the UI.
 */
export const getSafeErrorMessage = (error: any, fallback = "Erro ao processar solicitação"): string => {
  if (!error) return "Erro desconhecido";

  // PostgreSQL error codes
  if (error.code === "23505") return "Este registro já existe no sistema";
  if (error.code === "23503") return "Operação inválida — registro relacionado não encontrado";
  if (error.code === "23502") return "Campos obrigatórios não preenchidos";
  if (error.code === "42501") return "Sem permissão para realizar esta ação";

  // Common patterns (without leaking details)
  const msg = error.message || "";
  if (msg.includes("violates unique")) return "Este registro já existe no sistema";
  if (msg.includes("violates foreign key")) return "Registro relacionado não encontrado";
  if (msg.includes("violates not-null")) return "Campos obrigatórios não preenchidos";
  if (msg.includes("permission") || msg.includes("denied")) return "Sem permissão para realizar esta ação";
  if (msg.includes("JWT") || msg.includes("token")) return "Sessão expirada. Faça login novamente";
  if (msg.includes("network") || msg.includes("fetch")) return "Erro de conexão. Verifique sua internet";

  return fallback;
};
