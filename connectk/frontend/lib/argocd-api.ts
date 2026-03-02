import {
  ApplicationListSchema,
  ApplicationSchema,
  ApplicationTreeSchema,
  ApplicationSetListSchema,
  ApplicationSetSchema,
  RepositoryListSchema,
  ClusterListSchema,
  ClusterSchema,
  ProjectListSchema,
  ProjectSchema,
  AccountListSchema,
  AccountSchema,
  CertificateListSchema,
  GpgKeyListSchema,
  UserInfoSchema,
  VersionSchema,
  EventListSchema,
  AuthSettingsSchema,
  RepoCredsListSchema,
  type Application,
  type ApplicationTree,
  type ApplicationSet,
  type AuthSettings,
  type Repository,
  type Cluster,
  type Project,
  type Account,
  type Certificate,
  type RepoCreds,
  type UserInfo,
  type Version,
  type EventList,
  type SyncOptions,
  RevisionMetadataSchema,
  type RevisionMetadata,
} from "./argocd-schemas";

// All requests go through Next.js API proxy at /api/v1/*
const BASE = "/api/argocd/api/v1";

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let message = `Request failed: ${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      message = body.message || body.error || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return {} as T;
  }

  return res.json() as Promise<T>;
}

// ─── Applications ─────────────────────────────────────────────────────────────

export interface ListApplicationsParams {
  project?: string[];
  appNamespace?: string;
  name?: string;
  repo?: string;
  resourceVersion?: string;
}

export async function listApplications(params?: ListApplicationsParams) {
  const search = new URLSearchParams();
  if (params?.project) params.project.forEach((p) => search.append("projects", p));
  if (params?.appNamespace) search.set("appNamespace", params.appNamespace);
  if (params?.name) search.set("name", params.name);
  if (params?.repo) search.set("repo", params.repo);
  const qs = search.toString() ? `?${search}` : "";
  const raw = await request<unknown>(`/applications${qs}`);
  return ApplicationListSchema.parse(raw);
}

export async function getApplication(name: string, refresh?: "normal" | "hard") {
  const qs = refresh ? `?refresh=${refresh}` : "";
  const raw = await request<unknown>(`/applications/${encodeURIComponent(name)}${qs}`);
  return ApplicationSchema.parse(raw);
}

export async function createApplication(app: Partial<Application>) {
  const raw = await request<unknown>(`/applications`, {
    method: "POST",
    body: JSON.stringify(app),
  });
  return ApplicationSchema.parse(raw);
}

export async function updateApplication(name: string, app: Application) {
  const raw = await request<unknown>(`/applications/${encodeURIComponent(name)}`, {
    method: "PUT",
    body: JSON.stringify(app),
  });
  return ApplicationSchema.parse(raw);
}

export async function deleteApplication(name: string, cascade = true, propagationPolicy = "foreground") {
  await request<unknown>(
    `/applications/${encodeURIComponent(name)}?cascade=${cascade}&propagationPolicy=${propagationPolicy}`,
    { method: "DELETE" }
  );
}

export async function syncApplication(name: string, opts: SyncOptions = {}) {
  const raw = await request<unknown>(`/applications/${encodeURIComponent(name)}/sync`, {
    method: "POST",
    body: JSON.stringify(opts),
  });
  return ApplicationSchema.parse(raw);
}

export async function rollbackApplication(name: string, id: number) {
  const raw = await request<unknown>(`/applications/${encodeURIComponent(name)}/rollback`, {
    method: "POST",
    body: JSON.stringify({ id }),
  });
  return ApplicationSchema.parse(raw);
}

export async function terminateOperation(name: string) {
  await request<unknown>(`/applications/${encodeURIComponent(name)}/operation`, {
    method: "DELETE",
  });
}

export async function getApplicationTree(name: string) {
  const raw = await request<unknown>(`/applications/${encodeURIComponent(name)}/resource-tree`);
  return ApplicationTreeSchema.parse(raw);
}

export async function getApplicationEvents(name: string) {
  const raw = await request<unknown>(`/applications/${encodeURIComponent(name)}/events`);
  return EventListSchema.parse(raw);
}

export async function getRevisionMetadata(name: string, revision: string): Promise<RevisionMetadata> {
  const raw = await request<unknown>(
    `/applications/${encodeURIComponent(name)}/revisions/${encodeURIComponent(revision)}/metadata`
  );
  return RevisionMetadataSchema.parse(raw);
}

export interface ManagedResourcesParams {
  namespace?: string;
  name?: string;
  version?: string;
  group?: string;
  kind?: string;
}

export async function getManagedResources(appName: string, params?: ManagedResourcesParams) {
  const search = new URLSearchParams();
  if (params?.namespace) search.set("namespace", params.namespace);
  if (params?.name) search.set("resourceName", params.name);
  if (params?.group) search.set("group", params.group);
  if (params?.kind) search.set("kind", params.kind);
  if (params?.version) search.set("version", params.version);
  const qs = search.toString() ? `?${search}` : "";
  return request<{ items: unknown[] }>(`/applications/${encodeURIComponent(appName)}/managed-resources${qs}`);
}

export interface ResourceParams {
  namespace: string;
  resourceName: string;
  group?: string;
  version: string;
  kind: string;
}

export async function getResource(appName: string, params: ResourceParams) {
  const search = new URLSearchParams({
    namespace: params.namespace,
    resourceName: params.resourceName,
    version: params.version,
    kind: params.kind,
  });
  if (params.group) search.set("group", params.group);
  return request<{ manifest: string }>(
    `/applications/${encodeURIComponent(appName)}/resource?${search}`
  );
}

export async function deleteResource(
  appName: string,
  params: ResourceParams & { force?: boolean; orphan?: boolean }
) {
  const search = new URLSearchParams({
    namespace: params.namespace,
    resourceName: params.resourceName,
    version: params.version,
    kind: params.kind,
  });
  if (params.group) search.set("group", params.group);
  if (params.force) search.set("force", "true");
  if (params.orphan) search.set("orphan", "true");
  await request<unknown>(
    `/applications/${encodeURIComponent(appName)}/resource?${search}`,
    { method: "DELETE" }
  );
}

// Pod logs – returns a fetch Response that can be read as a stream
export function getPodLogsUrl(
  appName: string,
  podName: string,
  params: {
    container?: string;
    namespace?: string;
    follow?: boolean;
    tailLines?: number;
    sinceSeconds?: number;
    timestamps?: boolean;
    previous?: boolean;
    untilTime?: string;
    filter?: string;
  }
): string {
  const search = new URLSearchParams({ podName });
  if (params.container) search.set("container", params.container);
  if (params.namespace) search.set("namespace", params.namespace);
  if (params.follow) search.set("follow", "true");
  if (params.tailLines !== undefined) search.set("tailLines", String(params.tailLines));
  if (params.sinceSeconds !== undefined) search.set("sinceSeconds", String(params.sinceSeconds));
  if (params.timestamps) search.set("timestamps", "true");
  if (params.previous) search.set("previous", "true");
  if (params.untilTime) search.set("untilTime", params.untilTime);
  if (params.filter) search.set("filter", params.filter);
  return `${BASE}/applications/${encodeURIComponent(appName)}/pods/${encodeURIComponent(podName)}/logs?${search}`;
}

// ─── Repositories ─────────────────────────────────────────────────────────────

export async function listRepositories() {
  const raw = await request<unknown>(`/repositories`);
  return RepositoryListSchema.parse(raw);
}

export async function createRepository(repo: Partial<Repository>) {
  const raw = await request<unknown>(`/repositories`, {
    method: "POST",
    body: JSON.stringify(repo),
  });
  return raw as Repository;
}

export async function updateRepository(url: string, repo: Partial<Repository>) {
  const raw = await request<unknown>(`/repositories/${encodeURIComponent(url)}`, {
    method: "PUT",
    body: JSON.stringify(repo),
  });
  return raw as Repository;
}

export async function deleteRepository(url: string) {
  await request<unknown>(`/repositories/${encodeURIComponent(url)}`, { method: "DELETE" });
}

export async function validateRepository(repo: Partial<Repository>) {
  return request<{ connectionState: unknown }>(`/repositories`, {
    method: "POST",
    body: JSON.stringify(repo),
  });
}

// ─── Clusters ─────────────────────────────────────────────────────────────────

export async function listClusters() {
  const raw = await request<unknown>(`/clusters`);
  return ClusterListSchema.parse(raw);
}

export async function deleteCluster(server: string) {
  await request<unknown>(`/clusters/${encodeURIComponent(server)}`, { method: "DELETE" });
}

export async function updateCluster(server: string, cluster: Partial<Cluster>) {
  const raw = await request<unknown>(`/clusters/${encodeURIComponent(server)}`, {
    method: "PUT",
    body: JSON.stringify(cluster),
  });
  return raw as Cluster;
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function listProjects() {
  const raw = await request<unknown>(`/projects`);
  return ProjectListSchema.parse(raw);
}

export async function getProject(name: string) {
  const raw = await request<unknown>(`/projects/${encodeURIComponent(name)}`);
  return ProjectSchema.parse(raw);
}

export async function createProject(project: Partial<Project>) {
  const raw = await request<unknown>(`/projects`, {
    method: "POST",
    body: JSON.stringify({ project }),
  });
  return ProjectSchema.parse(raw);
}

export async function updateProject(name: string, project: Project) {
  const raw = await request<unknown>(`/projects/${encodeURIComponent(name)}`, {
    method: "PUT",
    body: JSON.stringify({ project }),
  });
  return ProjectSchema.parse(raw);
}

export async function deleteProject(name: string) {
  await request<unknown>(`/projects/${encodeURIComponent(name)}`, { method: "DELETE" });
}

export async function getProjectEvents(name: string) {
  const raw = await request<unknown>(`/projects/${encodeURIComponent(name)}/events`);
  return EventListSchema.parse(raw);
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

export async function listAccounts() {
  const raw = await request<unknown>(`/account`);
  return AccountListSchema.parse(raw);
}

export async function getAccount(name: string) {
  const raw = await request<unknown>(`/account/${encodeURIComponent(name)}`);
  return AccountSchema.parse(raw);
}

export async function updatePassword(currentPassword: string, newPassword: string, name?: string) {
  await request<unknown>(`/account/password`, {
    method: "PUT",
    body: JSON.stringify({ currentPassword, newPassword, name }),
  });
}

export async function createToken(name: string, expiresIn?: number, id?: string) {
  return request<{ token: string }>(`/account/${encodeURIComponent(name)}/token`, {
    method: "POST",
    body: JSON.stringify({ expiresIn, id }),
  });
}

export async function deleteToken(name: string, id: string) {
  await request<unknown>(`/account/${encodeURIComponent(name)}/token/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// ─── Certificates ─────────────────────────────────────────────────────────────

export async function listCertificates() {
  const raw = await request<unknown>(`/certificates`);
  return CertificateListSchema.parse(raw);
}

export async function createCertificate(cert: Partial<Certificate>) {
  const raw = await request<unknown>(`/certificates`, {
    method: "POST",
    body: JSON.stringify({ items: [cert] }),
  });
  return raw;
}

export async function deleteCertificate(serverName: string, certType: string, certSubType?: string) {
  const search = new URLSearchParams({ serverName, certType });
  if (certSubType) search.set("certSubType", certSubType);
  await request<unknown>(`/certificates?${search}`, { method: "DELETE" });
}

// ─── GPG Keys ─────────────────────────────────────────────────────────────────

export async function listGpgKeys() {
  const raw = await request<unknown>(`/gpgkeys`);
  return GpgKeyListSchema.parse(raw);
}

export async function createGpgKey(keyData: string) {
  const raw = await request<unknown>(`/gpgkeys`, {
    method: "POST",
    body: JSON.stringify({ publicKey: keyData }),
  });
  return raw;
}

export async function deleteGpgKey(keyID: string) {
  await request<unknown>(`/gpgkeys?keyID=${encodeURIComponent(keyID)}`, { method: "DELETE" });
}

// ─── User / Version ───────────────────────────────────────────────────────────

export async function getUserInfo(): Promise<UserInfo> {
  const raw = await request<unknown>(`/session/userinfo`);
  return UserInfoSchema.parse(raw);
}

export async function getVersion(): Promise<Version> {
  const res = await fetch(`/api/argocd/api/version`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    let message = `Request failed: ${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      message = body.message || body.error || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const raw = await res.json();
  return VersionSchema.parse(raw);
}

// ─── Application Resource Operations ──────────────────────────────────────────

export async function patchResource(
  appName: string,
  params: ResourceParams & { patch: string; patchType: string }
) {
  return request<unknown>(
    `/applications/${encodeURIComponent(appName)}/resource?${new URLSearchParams({
      namespace: params.namespace,
      resourceName: params.resourceName,
      version: params.version,
      kind: params.kind,
      ...(params.group ? { group: params.group } : {}),
      patchType: params.patchType,
    })}`,
    { method: "POST", body: params.patch }
  );
}

export async function getResourceActions(appName: string, params: Omit<ResourceParams, "version"> & { version?: string }) {
  const search = new URLSearchParams({
    namespace: params.namespace,
    resourceName: params.resourceName,
    kind: params.kind,
  });
  if (params.group) search.set("group", params.group);
  if (params.version) search.set("version", params.version);
  return request<{ actions: Array<{ name: string; disabled: boolean }> }>(
    `/applications/${encodeURIComponent(appName)}/resource/actions?${search}`
  );
}

export async function runResourceAction(
  appName: string,
  params: Omit<ResourceParams, "version"> & { version?: string },
  action: string
) {
  const search = new URLSearchParams({
    namespace: params.namespace,
    resourceName: params.resourceName,
    kind: params.kind,
  });
  if (params.group) search.set("group", params.group);
  if (params.version) search.set("version", params.version);
  return request<unknown>(
    `/applications/${encodeURIComponent(appName)}/resource/actions?${search}`,
    { method: "POST", body: JSON.stringify(action) }
  );
}

export async function getApplicationLinks(name: string) {
  return request<{ items: Array<{ title: string; url: string; description?: string; iconClass?: string }> }>(
    `/applications/${encodeURIComponent(name)}/links`
  );
}

export async function getResourceLinks(
  appName: string,
  params: Omit<ResourceParams, "version"> & { version?: string }
) {
  const search = new URLSearchParams({
    namespace: params.namespace,
    name: params.resourceName,
    kind: params.kind,
  });
  if (params.group) search.set("group", params.group);
  if (params.version) search.set("version", params.version);
  return request<{ items: Array<{ title: string; url: string; description?: string; iconClass?: string }> }>(
    `/applications/${encodeURIComponent(appName)}/resource/links?${search}`
  );
}

// ─── Sync Windows ─────────────────────────────────────────────────────────────

export async function getApplicationSyncWindows(name: string) {
  return request<{ activeWindows: unknown[]; assignedWindows: unknown[]; canSync: boolean }>(
    `/applications/${encodeURIComponent(name)}/syncwindows`
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<AuthSettings> {
  const raw = await request<unknown>(`/settings`);
  return AuthSettingsSchema.parse(raw);
}

// ─── RBAC ─────────────────────────────────────────────────────────────────────

export async function canI(
  resource: string,
  action: string,
  subresource: string
): Promise<boolean> {
  try {
    const raw = await request<{ value: string }>(
      `/account/can-i/${encodeURIComponent(resource)}/${encodeURIComponent(action)}/${encodeURIComponent(subresource)}`
    );
    return raw.value === "yes";
  } catch {
    return false;
  }
}

// ─── Cluster Detail ───────────────────────────────────────────────────────────

export async function getCluster(server: string) {
  const raw = await request<unknown>(`/clusters/${encodeURIComponent(server)}`);
  return ClusterSchema.parse(raw);
}

export async function invalidateClusterCache(server: string) {
  await request<unknown>(
    `/clusters/${encodeURIComponent(server)}/invalidate-cache`,
    { method: "POST" }
  );
}

// ─── Repo Credentials ────────────────────────────────────────────────────────

export async function listRepoCreds() {
  const raw = await request<unknown>(`/repocreds`);
  return RepoCredsListSchema.parse(raw);
}

export async function createRepoCreds(creds: Partial<RepoCreds>) {
  return request<unknown>(`/repocreds`, {
    method: "POST",
    body: JSON.stringify(creds),
  });
}

export async function updateRepoCreds(url: string, creds: Partial<RepoCreds>) {
  return request<unknown>(`/repocreds/${encodeURIComponent(url)}`, {
    method: "PUT",
    body: JSON.stringify(creds),
  });
}

export async function deleteRepoCreds(url: string) {
  await request<unknown>(`/repocreds/${encodeURIComponent(url)}`, {
    method: "DELETE",
  });
}

// ─── ApplicationSets ──────────────────────────────────────────────────────────

export async function listApplicationSets() {
  const raw = await request<unknown>(`/applicationsets`);
  return ApplicationSetListSchema.parse(raw);
}

export async function getApplicationSet(name: string) {
  const raw = await request<unknown>(`/applicationsets/${encodeURIComponent(name)}`);
  return ApplicationSetSchema.parse(raw);
}

export async function createApplicationSet(appSet: Partial<ApplicationSet>) {
  const raw = await request<unknown>(`/applicationsets`, {
    method: "POST",
    body: JSON.stringify(appSet),
  });
  return ApplicationSetSchema.parse(raw);
}

export async function deleteApplicationSet(name: string, cascade = true) {
  await request<unknown>(
    `/applicationsets/${encodeURIComponent(name)}?cascade=${cascade}`,
    { method: "DELETE" }
  );
}

// ─── Project Tokens & Sync Windows ────────────────────────────────────────────

export async function createProjectToken(
  projectName: string,
  role: string,
  expiresIn?: number,
  id?: string
) {
  return request<{ token: string }>(
    `/projects/${encodeURIComponent(projectName)}/roles/${encodeURIComponent(role)}/token`,
    { method: "POST", body: JSON.stringify({ expiresIn, id }) }
  );
}

export async function deleteProjectToken(
  projectName: string,
  role: string,
  iat: number
) {
  await request<unknown>(
    `/projects/${encodeURIComponent(projectName)}/roles/${encodeURIComponent(role)}/token/${iat}`,
    { method: "DELETE" }
  );
}

export async function getProjectSyncWindows(name: string) {
  return request<{ windows: unknown[] }>(
    `/projects/${encodeURIComponent(name)}/syncwindows`
  );
}
