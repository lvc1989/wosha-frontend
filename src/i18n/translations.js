// Real, working translation dictionary for the app itself — separate from the
// website's own i18n system (which already exists). Starting scope: navigation
// and the common, reused UI strings that appear on every page (Save, Cancel,
// Edit, Remove, etc.), since those are what's visible everywhere in the app,
// regardless of which page someone's on. Individual pages' own business
// content (each page's specific labels, forms, and messages) is a much larger
// undertaking — hundreds of distinct strings across 24+ pages — and stays in
// English for now, to be translated properly in a focused follow-up rather
// than rushed.
export const translations = {
  en: {
    nav_dashboard: "Dashboard", nav_home: "Home", nav_customers: "Customers", nav_services: "Services & Products",
    nav_sales: "Record Sale", nav_finance: "Finance", nav_inventory: "Inventory & Supply",
    nav_marketing: "Marketing", nav_staff: "Staff", nav_messages: "Messages",
    nav_compliance: "Compliance & Tasks", nav_reports: "Reports", nav_bookings: "Bookings",
    nav_settings: "Settings", nav_menu: "Menu",
    common_save: "Save", common_cancel: "Cancel", common_edit: "Edit", common_remove: "Remove",
    common_close: "Close", common_add: "Add", common_delete: "Delete", common_loading: "Loading…",
    common_search: "Search", common_all_branches: "All Branches",
  },
  sw: {
    nav_dashboard: "Dashibodi", nav_home: "Nyumbani", nav_customers: "Wateja", nav_services: "Huduma na Bidhaa",
    nav_sales: "Rekodi Mauzo", nav_finance: "Fedha", nav_inventory: "Bidhaa na Ugavi",
    nav_marketing: "Uuzaji", nav_staff: "Wafanyakazi", nav_messages: "Ujumbe",
    nav_compliance: "Uzingatiaji na Kazi", nav_reports: "Ripoti", nav_bookings: "Uhifadhi",
    nav_settings: "Mipangilio", nav_menu: "Menyu",
    common_save: "Hifadhi", common_cancel: "Ghairi", common_edit: "Hariri", common_remove: "Ondoa",
    common_close: "Funga", common_add: "Ongeza", common_delete: "Futa", common_loading: "Inapakia…",
    common_search: "Tafuta", common_all_branches: "Matawi Yote",
  },
  fr: {
    nav_dashboard: "Tableau de bord", nav_home: "Accueil", nav_customers: "Clients", nav_services: "Services et produits",
    nav_sales: "Enregistrer une vente", nav_finance: "Finances", nav_inventory: "Inventaire et approvisionnement",
    nav_marketing: "Marketing", nav_staff: "Personnel", nav_messages: "Messages",
    nav_compliance: "Conformité et tâches", nav_reports: "Rapports", nav_bookings: "Réservations",
    nav_settings: "Paramètres", nav_menu: "Menu",
    common_save: "Enregistrer", common_cancel: "Annuler", common_edit: "Modifier", common_remove: "Retirer",
    common_close: "Fermer", common_add: "Ajouter", common_delete: "Supprimer", common_loading: "Chargement…",
    common_search: "Rechercher", common_all_branches: "Toutes les succursales",
  },
};

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "sw", label: "Kiswahili" },
  { code: "fr", label: "Français" },
];
