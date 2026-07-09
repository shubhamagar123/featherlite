/**
 * Shared kernel module: Cross-engine domain types and utilities.
 *
 * Exported here to support multiple engines without creating coupling.
 * Companion, World, Notification, and other engines share these types.
 */

export * from './enums/kernel.enums';
export * from './types/weighted-option';
