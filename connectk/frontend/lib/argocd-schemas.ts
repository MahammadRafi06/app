import { z } from "zod";

const nullishArray = <T extends z.ZodTypeAny>(schema: T) =>
  z.array(schema).nullish().transform((value) => value ?? []);

const nullishRecord = <T extends z.ZodTypeAny>(schema: T) =>
  z.record(schema).nullish().transform((value) => value ?? {});

// ─── Primitives ───────────────────────────────────────────────────────────────

export const ObjectMetaSchema = z.object({
  name: z.string(),
  namespace: z.string().optional(),
  labels: z.record(z.string()).optional(),
  annotations: z.record(z.string()).optional(),
  resourceVersion: z.string().optional(),
  uid: z.string().optional(),
  creationTimestamp: z.string().optional(),
  deletionTimestamp: z.string().optional(),
  finalizers: z.array(z.string()).optional(),
  managedFields: z.array(z.unknown()).optional(),
}).passthrough();

export const HealthStatusSchema = z.object({
  status: z.enum(["Healthy", "Progressing", "Degraded", "Suspended", "Missing", "Unknown"]).optional(),
  message: z.string().optional(),
});

export const SyncStatusSchema = z.object({
  status: z.enum(["Synced", "OutOfSync", "Unknown"]),
  revision: z.string().optional(),
  revisions: z.array(z.string()).optional(),
  comparedTo: z.object({
    source: z.unknown().optional(),
    destination: z.unknown().optional(),
    sources: z.array(z.unknown()).optional(),
  }).optional(),
});

// ─── Application Source ────────────────────────────────────────────────────────

export const ApplicationSourceSchema = z.object({
  repoURL: z.string(),
  path: z.string().optional(),
  targetRevision: z.string().optional(),
  chart: z.string().optional(),
  helm: z.object({
    releaseName: z.string().optional(),
    valueFiles: z.array(z.string()).optional(),
    values: z.string().optional(),
    parameters: z.array(z.object({ name: z.string(), value: z.string() })).optional(),
    passCredentials: z.boolean().optional(),
    version: z.string().optional(),
  }).optional(),
  kustomize: z.object({
    namePrefix: z.string().optional(),
    nameSuffix: z.string().optional(),
    images: z.array(z.string()).optional(),
    replicas: z.array(z.object({ name: z.string(), count: z.union([z.string(), z.number()]) })).optional(),
    version: z.string().optional(),
  }).optional(),
  directory: z.object({
    recurse: z.boolean().optional(),
    jsonnet: z.unknown().optional(),
    exclude: z.string().optional(),
    include: z.string().optional(),
  }).optional(),
  plugin: z.unknown().optional(),
  ref: z.string().optional(),
}).passthrough();

// ─── Application Spec ─────────────────────────────────────────────────────────

export const ApplicationDestinationSchema = z.object({
  server: z.string().optional(),
  namespace: z.string().optional(),
  name: z.string().optional(),
});

export const SyncPolicySchema = z.object({
  automated: z.object({
    prune: z.boolean().optional(),
    selfHeal: z.boolean().optional(),
    allowEmpty: z.boolean().optional(),
  }).optional(),
  syncOptions: z.array(z.string()).optional(),
  retry: z.object({
    limit: z.number().optional(),
    backoff: z.object({
      duration: z.string().optional(),
      factor: z.number().optional(),
      maxDuration: z.string().optional(),
    }).optional(),
  }).optional(),
}).passthrough();

export const IgnoreDifferenceSchema = z.object({
  group: z.string().optional(),
  kind: z.string(),
  name: z.string().optional(),
  namespace: z.string().optional(),
  jsonPointers: z.array(z.string()).optional(),
  jqPathExpressions: z.array(z.string()).optional(),
  managedFieldsManagers: z.array(z.string()).optional(),
}).passthrough();

export type IgnoreDifference = z.infer<typeof IgnoreDifferenceSchema>;

export const ApplicationSpecSchema = z.object({
  source: ApplicationSourceSchema.optional(),
  sources: z.array(ApplicationSourceSchema).optional(),
  destination: ApplicationDestinationSchema,
  project: z.string(),
  syncPolicy: SyncPolicySchema.optional(),
  ignoreDifferences: z.array(IgnoreDifferenceSchema).optional(),
  info: z.array(z.object({ name: z.string(), value: z.string() })).optional(),
  revisionHistoryLimit: z.number().optional(),
}).passthrough();

// ─── Resource Status ──────────────────────────────────────────────────────────

export const ResourceStatusSchema = z.object({
  group: z.string().optional(),
  version: z.string().optional(),
  kind: z.string(),
  namespace: z.string().optional(),
  name: z.string(),
  status: z.string().optional(),
  health: HealthStatusSchema.optional(),
  hook: z.boolean().optional(),
  requiresPruning: z.boolean().optional(),
  syncWave: z.number().optional(),
  orphaned: z.boolean().optional(),
}).passthrough();

// ─── Operation State ──────────────────────────────────────────────────────────

export const OperationPhase = z.enum([
  "Running", "Failed", "Error", "Succeeded", "Terminating",
]);

export const OperationStateSchema = z.object({
  phase: OperationPhase.optional(),
  message: z.string().optional(),
  startedAt: z.string().optional(),
  finishedAt: z.string().optional(),
  operation: z.unknown().optional(),
  syncResult: z.object({
    resources: z.array(z.unknown()).optional(),
    revision: z.string().optional(),
    revisions: z.array(z.string()).optional(),
    source: ApplicationSourceSchema.optional(),
    sources: z.array(ApplicationSourceSchema).optional(),
  }).optional(),
  retryCount: z.number().optional(),
}).passthrough();

// ─── Application Status ───────────────────────────────────────────────────────

export const ApplicationStatusSchema = z.object({
  observedAt: z.string().optional(),
  resources: z.array(ResourceStatusSchema).optional(),
  sync: SyncStatusSchema.optional(),
  health: HealthStatusSchema.optional(),
  history: z.array(z.object({
    revision: z.string(),
    deployedAt: z.string(),
    id: z.number(),
    source: ApplicationSourceSchema.optional(),
    sources: z.array(ApplicationSourceSchema).optional(),
    deployStartedAt: z.string().optional(),
    initiatedBy: z.object({ username: z.string().optional(), automated: z.boolean().optional() }).optional(),
  })).optional(),
  conditions: z.array(z.object({
    type: z.string(),
    message: z.string(),
    lastTransitionTime: z.string().optional(),
  })).optional(),
  operationState: OperationStateSchema.optional(),
  reconciledAt: z.string().optional(),
  sourceType: z.string().optional(),
  sourceTypes: z.array(z.string()).optional(),
  summary: z.object({
    images: z.array(z.string()).optional(),
    externalURLs: z.array(z.string()).optional(),
  }).optional(),
}).passthrough();

// ─── Application ──────────────────────────────────────────────────────────────

export const ApplicationSchema = z.object({
  apiVersion: z.string().optional(),
  kind: z.string().optional(),
  metadata: ObjectMetaSchema,
  spec: ApplicationSpecSchema,
  status: ApplicationStatusSchema.optional(),
  operation: z.unknown().optional(),
}).passthrough();

export const ApplicationListSchema = z.object({
  metadata: z.object({ resourceVersion: z.string().optional() }).optional(),
  items: nullishArray(ApplicationSchema),
});

export type Application = z.infer<typeof ApplicationSchema>;
export type ApplicationList = z.infer<typeof ApplicationListSchema>;
export type ApplicationSpec = z.infer<typeof ApplicationSpecSchema>;
export type ApplicationSource = z.infer<typeof ApplicationSourceSchema>;
export type ApplicationStatus = z.infer<typeof ApplicationStatusSchema>;
export type ResourceStatus = z.infer<typeof ResourceStatusSchema>;
export type HealthStatus = z.infer<typeof HealthStatusSchema>;
export type SyncStatus = z.infer<typeof SyncStatusSchema>;
export type OperationState = z.infer<typeof OperationStateSchema>;

// ─── Resource Tree ────────────────────────────────────────────────────────────

export const ResourceNodeSchema = z.object({
  group: z.string().optional(),
  version: z.string().optional(),
  kind: z.string(),
  namespace: z.string().optional(),
  name: z.string(),
  uid: z.string().optional(),
  parentRefs: z.array(z.object({
    group: z.string().optional(),
    version: z.string().optional(),
    kind: z.string().optional(),
    namespace: z.string().optional(),
    name: z.string().optional(),
    uid: z.string().optional(),
  })).optional(),
  info: z.array(z.object({ name: z.string(), value: z.string() })).optional(),
  networkingInfo: z.unknown().optional(),
  images: z.array(z.string()).optional(),
  resourceVersion: z.string().optional(),
  health: HealthStatusSchema.optional(),
  createdAt: z.string().optional(),
}).passthrough();

export const ApplicationTreeSchema = z.object({
  nodes: nullishArray(ResourceNodeSchema).optional(),
  hosts: z.array(z.unknown()).nullish().optional(),
  orphanedNodes: nullishArray(ResourceNodeSchema).optional(),
}).passthrough();

export type ResourceNode = z.infer<typeof ResourceNodeSchema>;
export type ApplicationTree = z.infer<typeof ApplicationTreeSchema>;

// ─── Repository ───────────────────────────────────────────────────────────────

export const RepositorySchema = z.object({
  repo: z.string(),
  type: z.string().optional(),
  name: z.string().optional(),
  connectionState: z.object({
    status: z.string().optional(),
    message: z.string().optional(),
    attemptedAt: z.string().optional(),
  }).optional(),
  username: z.string().optional(),
  insecure: z.boolean().optional(),
  enableLfs: z.boolean().optional(),
  project: z.string().optional(),
}).passthrough();

export const RepositoryListSchema = z.object({
  metadata: z.unknown().optional(),
  items: nullishArray(RepositorySchema),
});

export type Repository = z.infer<typeof RepositorySchema>;
export type RepositoryList = z.infer<typeof RepositoryListSchema>;

// ─── Cluster ──────────────────────────────────────────────────────────────────

export const ClusterSchema = z.object({
  name: z.string().optional(),
  server: z.string(),
  connectionState: z.object({
    status: z.string().optional(),
    message: z.string().optional(),
    attemptedAt: z.string().optional(),
  }).optional(),
  serverVersion: z.string().optional(),
  namespaces: z.array(z.string()).optional(),
  labels: z.record(z.string()).optional(),
  annotations: z.record(z.string()).optional(),
  config: z.object({
    tlsClientConfig: z.unknown().optional(),
    awsAuthConfig: z.unknown().optional(),
    execProviderConfig: z.unknown().optional(),
  }).optional(),
  cacheInfo: z.object({
    resourcesCount: z.number().optional(),
    apisCount: z.number().optional(),
    lastCacheSyncTime: z.string().optional(),
  }).optional(),
  info: z.object({
    serverVersion: z.string().optional(),
    applicationsCount: z.number().optional(),
    connectionState: z.object({ status: z.string().optional(), message: z.string().optional() }).optional(),
  }).optional(),
}).passthrough();

export const ClusterListSchema = z.object({
  metadata: z.unknown().optional(),
  items: nullishArray(ClusterSchema),
});

export type Cluster = z.infer<typeof ClusterSchema>;
export type ClusterList = z.infer<typeof ClusterListSchema>;

// ─── Project ──────────────────────────────────────────────────────────────────

export const ProjectSchema = z.object({
  metadata: ObjectMetaSchema,
  spec: z.object({
    description: z.string().optional(),
    sourceRepos: z.array(z.string()).optional(),
    destinations: z.array(z.object({
      server: z.string().optional(),
      namespace: z.string().optional(),
      name: z.string().optional(),
    })).optional(),
    roles: z.array(z.object({
      name: z.string(),
      description: z.string().optional(),
      policies: z.array(z.string()).optional(),
      groups: z.array(z.string()).optional(),
      jwtTokens: z.array(z.object({ iat: z.number(), exp: z.number().optional(), id: z.string().optional() })).optional(),
    })).optional(),
    clusterResourceWhitelist: z.array(z.object({ group: z.string(), kind: z.string() })).optional(),
    clusterResourceBlacklist: z.array(z.object({ group: z.string(), kind: z.string() })).optional(),
    namespaceResourceBlacklist: z.array(z.object({ group: z.string(), kind: z.string() })).optional(),
    namespaceResourceWhitelist: z.array(z.object({ group: z.string(), kind: z.string() })).optional(),
    syncWindows: z.array(z.object({
      kind: z.string().optional(),
      schedule: z.string().optional(),
      duration: z.string().optional(),
      applications: z.array(z.string()).optional(),
      namespaces: z.array(z.string()).optional(),
      clusters: z.array(z.string()).optional(),
      manualSync: z.boolean().optional(),
    })).optional(),
    orphanedResources: z.object({ warn: z.boolean().optional() }).optional(),
  }).passthrough(),
  status: z.unknown().optional(),
}).passthrough();

export const ProjectListSchema = z.object({
  metadata: z.unknown().optional(),
  items: nullishArray(ProjectSchema),
});

export type Project = z.infer<typeof ProjectSchema>;
export type ProjectList = z.infer<typeof ProjectListSchema>;

// ─── Account ──────────────────────────────────────────────────────────────────

export const AccountSchema = z.object({
  name: z.string(),
  enabled: z.boolean().optional(),
  capabilities: z.array(z.string()).nullish().optional(),
  tokens: z.array(z.object({
    id: z.string().optional(),
    iat: z.number().optional(),
    exp: z.number().optional(),
  })).nullish().optional(),
}).passthrough();

export const AccountListSchema = z.object({
  items: nullishArray(AccountSchema),
});

export type Account = z.infer<typeof AccountSchema>;
export type AccountList = z.infer<typeof AccountListSchema>;

// ─── Certificates ─────────────────────────────────────────────────────────────

export const CertificateSchema = z.object({
  serverName: z.string(),
  certType: z.string(),
  certData: z.string().optional(),
  certInfo: z.string().optional(),
  certSubType: z.string().optional(),
}).passthrough();

export const CertificateListSchema = z.object({
  items: nullishArray(CertificateSchema),
});

export type Certificate = z.infer<typeof CertificateSchema>;
export type CertificateList = z.infer<typeof CertificateListSchema>;

// ─── GPG Keys ─────────────────────────────────────────────────────────────────

export const GpgKeySchema = z.object({
  keyID: z.string(),
  fingerprint: z.string().optional(),
  owner: z.string().optional(),
  subType: z.string().optional(),
  trust: z.string().optional(),
}).passthrough();

export const GpgKeyListSchema = z.object({
  items: nullishRecord(GpgKeySchema),
});

export type GpgKey = z.infer<typeof GpgKeySchema>;

// ─── User Info ────────────────────────────────────────────────────────────────

export const UserInfoSchema = z.object({
  loggedIn: z.boolean().optional(),
  username: z.string().optional(),
  iss: z.string().optional(),
  groups: z.array(z.string()).optional(),
}).passthrough();

export type UserInfo = z.infer<typeof UserInfoSchema>;

// ─── Version ──────────────────────────────────────────────────────────────────

export const VersionSchema = z.object({
  Version: z.string().optional(),
  BuildDate: z.string().optional(),
  GitCommit: z.string().optional(),
  GitTag: z.string().optional(),
  GoVersion: z.string().optional(),
  Platform: z.string().optional(),
}).passthrough();

export type Version = z.infer<typeof VersionSchema>;

// ─── Events ───────────────────────────────────────────────────────────────────

export const EventSchema = z.object({
  metadata: ObjectMetaSchema,
  involvedObject: z.object({
    kind: z.string().optional(),
    namespace: z.string().optional(),
    name: z.string().optional(),
    uid: z.string().optional(),
    apiVersion: z.string().optional(),
    resourceVersion: z.string().optional(),
    fieldPath: z.string().optional(),
  }).optional(),
  reason: z.string().optional(),
  message: z.string().optional(),
  source: z.object({ component: z.string().optional(), host: z.string().optional() }).optional(),
  firstTimestamp: z.string().optional(),
  lastTimestamp: z.string().optional(),
  count: z.number().optional(),
  type: z.string().optional(),
  eventTime: z.string().nullish(),
}).passthrough();

export const EventListSchema = z.object({
  metadata: z.unknown().optional(),
  items: nullishArray(EventSchema),
});

export type Event = z.infer<typeof EventSchema>;
export type EventList = z.infer<typeof EventListSchema>;

// ─── Managed Resource ─────────────────────────────────────────────────────────

export const ManagedResourceSchema = z.object({
  group: z.string().optional(),
  version: z.string().optional(),
  kind: z.string(),
  namespace: z.string().optional(),
  name: z.string(),
  liveState: z.string().optional(),
  targetState: z.string().optional(),
  predictedLiveState: z.string().optional(),
  normalizedLiveState: z.string().optional(),
  status: z.string().optional(),
  health: HealthStatusSchema.optional(),
  hook: z.boolean().optional(),
  requiresPruning: z.boolean().optional(),
}).passthrough();

export type ManagedResource = z.infer<typeof ManagedResourceSchema>;

// ─── Sync Operation Request ───────────────────────────────────────────────────

export const SyncOptionsSchema = z.object({
  prune: z.boolean().optional(),
  dryRun: z.boolean().optional(),
  force: z.boolean().optional(),
  applyOnly: z.boolean().optional(),
  replace: z.boolean().optional(),
  serverSideApply: z.boolean().optional(),
  skipSchemaValidation: z.boolean().optional(),
  autoCreateNamespace: z.boolean().optional(),
  pruneLast: z.boolean().optional(),
  applyOutOfSyncOnly: z.boolean().optional(),
  respectIgnoreDifferences: z.boolean().optional(),
  prunePropagationPolicy: z.enum(["foreground", "background", "orphan"]).optional(),
  retryStrategy: z.object({
    limit: z.number().optional(),
    backoff: z.object({
      duration: z.string().optional(),
      factor: z.number().optional(),
      maxDuration: z.string().optional(),
    }).optional(),
  }).optional(),
  revision: z.string().optional(),
  resources: z.array(z.object({
    group: z.string().optional(),
    kind: z.string(),
    name: z.string(),
    namespace: z.string().optional(),
  })).optional(),
}).passthrough();

export type SyncOptions = z.infer<typeof SyncOptionsSchema>;

// ─── Repo Creds ───────────────────────────────────────────────────────────────

export const RepoCredsSchema = z.object({
  url: z.string(),
  username: z.string().optional(),
  password: z.string().optional(),
  sshPrivateKey: z.string().optional(),
  tlsClientCertData: z.string().optional(),
  tlsClientCertKey: z.string().optional(),
  githubAppID: z.number().optional(),
  githubAppInstallationID: z.number().optional(),
  githubAppPrivateKey: z.string().optional(),
  githubAppEnterpriseBaseUrl: z.string().optional(),
  gcpServiceAccountKey: z.string().optional(),
  type: z.string().optional(),
  proxy: z.string().optional(),
  forceHttpBasicAuth: z.boolean().optional(),
  enableOCI: z.boolean().optional(),
}).passthrough();

export const RepoCredsListSchema = z.object({
  items: nullishArray(RepoCredsSchema),
});

export type RepoCreds = z.infer<typeof RepoCredsSchema>;

// ─── Revision Metadata ────────────────────────────────────────────────────────

export const RevisionMetadataSchema = z.object({
  author: z.string().optional(),
  date: z.string().optional(),
  message: z.string().optional(),
  tags: z.array(z.string()).optional(),
  signatureInfo: z.string().optional(),
}).passthrough();

export type RevisionMetadata = z.infer<typeof RevisionMetadataSchema>;

// ─── Server Settings ─────────────────────────────────────────────────────────

export const AuthSettingsSchema = z.object({
  url: z.string().optional(),
  statusBadgeEnabled: z.boolean().optional(),
  statusBadgeRootUrl: z.string().optional(),
  googleAnalytics: z.object({
    trackingID: z.string().optional(),
    anonymizeUsers: z.boolean().optional(),
  }).optional(),
  dexConfig: z.object({
    connectors: z.array(z.unknown()).optional(),
  }).optional(),
  oidcConfig: z.object({
    name: z.string().optional(),
    issuer: z.string().optional(),
    clientID: z.string().optional(),
    scopes: z.array(z.string()).optional(),
  }).optional(),
  help: z.object({
    chatUrl: z.string().optional(),
    chatText: z.string().optional(),
    binaryUrls: z.record(z.string()).optional(),
  }).optional(),
  userLoginsDisabled: z.boolean().optional(),
  kustomizeVersions: z.array(z.string()).optional(),
  uiCssURL: z.string().optional(),
  uiBannerContent: z.string().optional(),
  uiBannerURL: z.string().optional(),
  uiBannerPermanent: z.boolean().optional(),
  uiBannerPosition: z.string().optional(),
  execEnabled: z.boolean().optional(),
  appsInAnyNamespaceEnabled: z.boolean().optional(),
  passwordPattern: z.string().optional(),
  controllerNamespace: z.string().optional(),
}).passthrough();

export type AuthSettings = z.infer<typeof AuthSettingsSchema>;

// ─── ApplicationSet ──────────────────────────────────────────────────────────

export const ApplicationSetGeneratorSchema = z.object({
  git: z.unknown().optional(),
  list: z.unknown().optional(),
  clusters: z.unknown().optional(),
  pullRequest: z.unknown().optional(),
  merge: z.unknown().optional(),
  matrix: z.unknown().optional(),
  scmProvider: z.unknown().optional(),
  clusterDecisionResource: z.unknown().optional(),
}).passthrough();

export const ApplicationSetSpecSchema = z.object({
  goTemplate: z.boolean().optional(),
  goTemplateOptions: z.array(z.string()).optional(),
  generators: z.array(ApplicationSetGeneratorSchema).optional(),
  template: z.object({
    metadata: ObjectMetaSchema.partial().optional(),
    spec: ApplicationSpecSchema.partial().optional(),
  }).optional(),
  syncPolicy: z.object({
    preserveResourcesOnDeletion: z.boolean().optional(),
    applicationsSync: z.string().optional(),
  }).optional(),
  strategy: z.unknown().optional(),
}).passthrough();

export const ApplicationSetStatusSchema = z.object({
  conditions: z.array(z.object({
    type: z.string(),
    message: z.string().optional(),
    status: z.string().optional(),
    reason: z.string().optional(),
    lastTransitionTime: z.string().optional(),
  })).optional(),
  resources: z.array(z.object({
    group: z.string().optional(),
    kind: z.string().optional(),
    name: z.string().optional(),
    namespace: z.string().optional(),
    status: z.string().optional(),
    health: HealthStatusSchema.optional(),
    message: z.string().optional(),
  })).optional(),
  applicationStatus: z.array(z.object({
    application: z.string(),
    status: z.string().optional(),
    message: z.string().optional(),
    lastTransitionTime: z.string().optional(),
    step: z.string().optional(),
    targetRevisions: z.array(z.string()).optional(),
  })).optional(),
}).passthrough();

export const ApplicationSetSchema = z.object({
  apiVersion: z.string().optional(),
  kind: z.string().optional(),
  metadata: ObjectMetaSchema,
  spec: ApplicationSetSpecSchema,
  status: ApplicationSetStatusSchema.optional(),
}).passthrough();

export const ApplicationSetListSchema = z.object({
  metadata: z.object({ resourceVersion: z.string().optional() }).optional(),
  items: nullishArray(ApplicationSetSchema),
});

export type ApplicationSet = z.infer<typeof ApplicationSetSchema>;
export type ApplicationSetList = z.infer<typeof ApplicationSetListSchema>;
export type ApplicationSetSpec = z.infer<typeof ApplicationSetSpecSchema>;
export type ApplicationSetStatus = z.infer<typeof ApplicationSetStatusSchema>;
