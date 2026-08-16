// Types calqués sur les réponses de bankoplus-api (voir API-REFERENCE.md)

export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
}

// --- Auth ---

export interface RegisterResponse {
  userId: string;
  mfaSetupToken: string;
}

export interface MfaSetupResponse {
  otpauthUrl: string;
  qrCodeDataUrl: string;
  secret: string;
}

export interface LoginStepOneResponse {
  status: "mfa_challenge_required" | "mfa_setup_required";
  token: string;
}

export interface LoginVerifyResponse {
  accessToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

// --- Comptes ---

export interface Account {
  id: string;
  userId: string;
  label: string;
  bankName: string | null;
  currency: string;
  // Solde connu à referenceDate, saisi manuellement — null tant que
  // l'utilisateur ne l'a pas renseigné.
  referenceBalance: number | null;
  referenceDate: string | null;
  // Calculé par l'API : referenceBalance + transactions depuis referenceDate.
  // null si referenceBalance/referenceDate ne sont pas renseignés (solde
  // inconnu, à ne pas confondre avec un solde de 0€).
  currentBalance: number | null;
  createdAt: string;
}

// --- Import ---

export interface ImportBatch {
  id: string;
  userId: string;
  accountId: string;
  filename: string;
  sourceType: "csv" | "pdf";
  status: "completed" | "partial" | "failed";
  totalRows: number;
  importedRows: number;
  failedRows: number;
  createdAt: string;
}

// --- Transactions ---

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  date: string;
  label: string;
  amount: number;
  categoryId: string | null;
  importBatchId: string | null;
  createdAt: string;
}

// --- Catégories ---

export type CategoryKind = "income" | "expense";

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  userId: string | null;
  // Facture qui tombe ~1x/mois (loyer, énergie, abonnement...) — change la
  // façon dont le budget projette cette catégorie en fin de mois.
  isFixedExpense: boolean;
  createdAt: string;
}

export type CategoryRuleDirection = "credit" | "debit";

export interface CategoryRule {
  id: string;
  categoryId: string;
  keyword: string;
  // Gardes optionnelles en plus du mot-clé : la règle ne s'applique que si
  // le montant absolu dépasse minAmount et/ou si le sens correspond.
  minAmount: number | null;
  direction: CategoryRuleDirection | null;
  userId: string | null;
  createdAt: string;
}

// --- Budgets ---

export interface Budget {
  id: string;
  categoryId: string | null;
  monthlyLimit: number;
}

export interface BudgetProgress {
  id: string;
  categoryId: string | null;
  monthlyLimit: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  projectedMonthEnd: number;
  isOverBudget: boolean;
  isProjectedOverBudget: boolean;
}

export interface BudgetsOverview {
  month: string;
  daysElapsed: number;
  daysInMonth: number;
  isCurrentMonth: boolean;
  // Somme des currentBalance des comptes ayant une référence renseignée.
  // null si aucun compte n'a de référence.
  currentBalance: number | null;
  totalIncome: number;
  totalExpenses: number;
  projectedExpensesMonthEnd: number;
  // "Combien il restera fin de mois" : basé sur currentBalance si connu
  // (moins les factures fixes pas encore tombées, sans ajouter de revenu à
  // venir — peut être inférieur à currentBalance, c'est voulu), sinon repli
  // sur totalIncome - projectedExpensesMonthEnd (estimation grossière).
  projectedBalance: number;
}

export interface BudgetSimulation {
  categoryId: string | null;
  amount: number;
  spentBeforePurchase: number;
  spentAfterPurchase: number;
  projectedMonthEndAfterPurchase: number;
  projectedBalanceAfterPurchase: number;
  budgetLimit: number | null;
  wouldExceedBudget: boolean | null;
  wouldExceedProjectedBudget: boolean | null;
}
