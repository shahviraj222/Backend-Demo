// This file is unfinished. Some resources are missing and some roles are missing

export type Resource =
  | 'business'
  | 'user'
  | 'waitlist-entry'
  | 'review'
  | 'service-group'
  | 'admin-user'
  | 'appointment'
  | 'product-order-item'
  | 'product-order'
  | 'product'
  | 'staff-recurring-availability'
  | 'staff-service-assignment'

export type Action = 'create' | 'delete' | 'update' | 'view'

const ALL_RESOURCES: Resource[] = [
  'business',
  'user',
  'waitlist-entry',
  'review',
  'service-group',
  'admin-user',
  'appointment',
  'product-order-item',
  'product-order',
  'product',
  'staff-recurring-availability',
  'staff-service-assignment',
]

const ALL_ACTIONS: Action[] = ['create', 'delete', 'update', 'view']

const permissionStatements: Partial<Record<Resource, Action[]>> = {}

for (const resource of ALL_RESOURCES) {
  permissionStatements[resource] = ALL_ACTIONS
}

const businessOwnerPermissions: Partial<Record<Resource, Action[]>> = {
  business: ['view', 'create', 'update', 'delete'],
  user: ['update', 'view', 'create'],
  'waitlist-entry': ['view', 'create', 'update', 'delete'],
  review: ['view'],
  'service-group': ['view', 'create', 'update', 'delete'],
  appointment: ['view', 'create', 'update', 'delete'],
  'product-order-item': ['view', 'create', 'update', 'delete'],
  'product-order': ['view', 'create', 'update', 'delete'],
  product: ['view', 'create', 'update', 'delete'],
  'staff-recurring-availability': ['view', 'create', 'update', 'delete'],
  'staff-service-assignment': ['view', 'create', 'update', 'delete'],
}

const businessStaffPermissions: Partial<Record<Resource, Action[]>> = {
  user: ['update', 'view', 'create'],
  business: ['view', 'update'],
  product: ['view', 'create', 'update', 'delete'],
  'product-order-item': ['view', 'delete'],
  'product-order': ['view', 'delete'],
  'staff-recurring-availability': ['view', 'create', 'update', 'delete'],
  'staff-service-assignment': ['view', 'create', 'update', 'delete'],
}

const customerPermissions: Partial<Record<Resource, Action[]>> = {
  business: ['view'],
  appointment: ['view', 'create', 'delete', 'update'],
  review: ['view', 'create', 'update', 'delete'],
  'product-order-item': ['view', 'create', 'update', 'delete'],
  'product-order': ['view', 'create', 'update', 'delete'],
  product: ['view'],
  user: ['update', 'view', 'create'],
}

export type PermissionsMap = { [key in Resource]?: Action[] }

export const ALL_PERMISSIONS: { [role: string]: PermissionsMap } = {
  admin: permissionStatements,
  businessOwner: businessOwnerPermissions,
  businessStaff: businessStaffPermissions,
  customer: customerPermissions,
}
