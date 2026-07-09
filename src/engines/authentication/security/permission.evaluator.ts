/**
 * Permission Evaluator
 * Evaluates permissions and authorization
 */

import { UserRole, PermissionType, PermissionPolicy, AuthenticationContext } from '../types';
import { createLogger } from '@utils/logger';

export class PermissionEvaluator {
  private logger = createLogger(this.constructor.name);
  private policies = new Map<UserRole, PermissionPolicy>();

  constructor() {
    this.initializeDefaultPolicies();
  }

  private initializeDefaultPolicies(): void {
    // Guest permissions
    this.policies.set(UserRole.GUEST, {
      id: 'policy-guest',
      role: UserRole.GUEST,
      permissions: [PermissionType.READ],
      resources: ['public/*'],
    });

    // User permissions
    this.policies.set(UserRole.USER, {
      id: 'policy-user',
      role: UserRole.USER,
      permissions: [PermissionType.READ, PermissionType.WRITE],
      resources: ['user/*', 'companion/*', 'conversation/*'],
    });

    // Admin permissions
    this.policies.set(UserRole.ADMIN, {
      id: 'policy-admin',
      role: UserRole.ADMIN,
      permissions: [
        PermissionType.READ,
        PermissionType.WRITE,
        PermissionType.DELETE,
        PermissionType.ADMIN,
      ],
      resources: ['*'],
    });

    // Developer permissions
    this.policies.set(UserRole.DEVELOPER, {
      id: 'policy-developer',
      role: UserRole.DEVELOPER,
      permissions: [
        PermissionType.READ,
        PermissionType.WRITE,
        PermissionType.DELETE,
        PermissionType.DEVELOPER,
      ],
      resources: ['*'],
    });
  }

  hasPermission(
    context: AuthenticationContext,
    requiredPermission: PermissionType
  ): boolean {
    return context.permissions.includes(requiredPermission);
  }

  hasAnyPermission(
    context: AuthenticationContext,
    requiredPermissions: PermissionType[]
  ): boolean {
    return requiredPermissions.some(perm => context.permissions.includes(perm));
  }

  hasAllPermissions(
    context: AuthenticationContext,
    requiredPermissions: PermissionType[]
  ): boolean {
    return requiredPermissions.every(perm => context.permissions.includes(perm));
  }

  hasRole(context: AuthenticationContext, requiredRole: UserRole): boolean {
    return context.roles.includes(requiredRole);
  }

  hasAnyRole(context: AuthenticationContext, requiredRoles: UserRole[]): boolean {
    return requiredRoles.some(role => context.roles.includes(role));
  }

  hasAllRoles(context: AuthenticationContext, requiredRoles: UserRole[]): boolean {
    return requiredRoles.every(role => context.roles.includes(role));
  }

  canAccessResource(
    context: AuthenticationContext,
    resource: string
  ): boolean {
    for (const role of context.roles) {
      const policy = this.policies.get(role);

      if (policy) {
        const hasAccess = policy.resources.some(res => this.matchResource(res, resource));

        if (hasAccess) {
          return true;
        }
      }
    }

    return false;
  }

  private matchResource(pattern: string, resource: string): boolean {
    if (pattern === '*') {
      return true;
    }

    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -2);
      return resource.startsWith(prefix);
    }

    return pattern === resource;
  }

  addPolicy(policy: PermissionPolicy): void {
    this.policies.set(policy.role, policy);
    this.logger.debug(`Added permission policy for role ${policy.role}`);
  }

  getPolicy(role: UserRole): PermissionPolicy | undefined {
    return this.policies.get(role);
  }

  getAllPolicies(): PermissionPolicy[] {
    return Array.from(this.policies.values());
  }
}
