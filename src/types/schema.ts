export type UserRole = 'admin' | 'member' | 'viewer';

export interface User {
  id: string; // Matches Firebase Auth UID
  email: string;
  organizationId: string;
  role: UserRole;
}

export interface Organization {
  id: string;
  name: string;
  createdAt: Date;
}

export interface Client {
  id: string;
  organizationId: string;
  name: string;
  industry?: string;
  createdAt: Date;
}

export interface Application {
  id: string;
  organizationId: string;
  clientId?: string;
  name: string;
  description: string;
  status: 'active' | 'archived';
  createdAt: Date;
}

export interface Feature {
  id: string;
  applicationId: string;
  name: string;
  description: string;
  status: 'planned' | 'in_progress' | 'completed';
}

export interface KnowledgeItem {
  id: string;
  applicationId: string;
  type: 'code' | 'documentation' | 'database' | 'architecture';
  title: string;
  content: string; // Or reference to Cloud Storage if large
  metadata?: Record<string, any>;
}

export interface Relationship {
  id: string;
  applicationId: string;
  sourceId: string;
  targetId: string;
  type: 'depends_on' | 'implements' | 'references';
}

export interface Artifact {
  id: string;
  applicationId: string;
  name: string;
  type: string;
  storageUrl?: string; // Optional if stored directly in Firestore
  createdAt: Date;
  description?: string;
  source?: string;
  path?: string;
  content?: string;
  version?: string;
  clientId?: string;
  featureId?: string;
  tags?: string[];
  relatedArtifactIds?: string[];
  implements?: string[];
  dependsOn?: string[];
  supersedes?: string[];
  contradicts?: string[];
  validates?: string[];
  affects?: string[];
  status?: 'active' | 'deprecated' | 'draft' | 'proposed';
  owner?: string;
  team?: string;
  isBaseline?: boolean;
  lastVerifiedAt?: string;
  sourceArtifactIds?: string[];
}

export interface Conversation {
  id: string;
  applicationId: string;
  userId: string;
  title: string;
  createdAt: Date;
}
