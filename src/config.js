export const APP_NAME = 'Wish-a-List'

// Mirror the limits and checks enforced by the database (supabase/migrations/001_multi_user.sql).
export const LIMITS = { lists: 20, itemsPerList: 200 }
export const LIST_TITLE_MAX = 100

// TODO: set the full name of the person responsible for the data (shown on /privacy).
export const CONTROLLER_NAME = 'Nombre y apellidos del responsable'

// TODO: set the address that answers privacy requests (shown on /privacy).
export const CONTACT_EMAIL = 'privacidad@example.com'
