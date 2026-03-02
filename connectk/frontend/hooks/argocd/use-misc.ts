"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCertificate,
  createGpgKey,
  createToken,
  deleteCertificate,
  deleteGpgKey,
  deleteToken,
  getAccount,
  getUserInfo,
  getVersion,
  listAccounts,
  listCertificates,
  listGpgKeys,
  updatePassword,
} from "@/lib/argocd-api";
import { toast } from "sonner";

export const miscKeys = {
  userInfo: ["misc", "user-info"] as const,
  version: ["misc", "version"] as const,
  accounts: ["misc", "accounts"] as const,
  certificates: ["misc", "certificates"] as const,
  gpgKeys: ["misc", "gpgkeys"] as const,
};

export function useUserInfo() {
  return useQuery({
    queryKey: miscKeys.userInfo,
    queryFn: getUserInfo,
    refetchInterval: 30_000,
  });
}

export function useVersion() {
  return useQuery({
    queryKey: miscKeys.version,
    queryFn: getVersion,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

export function useAccounts() {
  return useQuery({
    queryKey: miscKeys.accounts,
    queryFn: listAccounts,
    refetchInterval: 30_000,
  });
}

export function useCertificates() {
  return useQuery({
    queryKey: miscKeys.certificates,
    queryFn: listCertificates,
    refetchInterval: 30_000,
  });
}

export function useGpgKeys() {
  return useQuery({
    queryKey: miscKeys.gpgKeys,
    queryFn: listGpgKeys,
    refetchInterval: 30_000,
  });
}

export function useAccount(name: string, enabled = true) {
  return useQuery({
    queryKey: [...miscKeys.accounts, name],
    queryFn: () => getAccount(name),
    enabled: !!name && enabled,
  });
}

export function useCreateToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, expiresIn, id }: { name: string; expiresIn?: number; id?: string }) =>
      createToken(name, expiresIn, id),
    onSuccess: () => {
      toast.success("API token created");
      qc.invalidateQueries({ queryKey: miscKeys.accounts });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, id }: { name: string; id: string }) => deleteToken(name, id),
    onSuccess: () => {
      toast.success("API token deleted");
      qc.invalidateQueries({ queryKey: miscKeys.accounts });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
      name,
    }: {
      currentPassword: string;
      newPassword: string;
      name?: string;
    }) => updatePassword(currentPassword, newPassword, name),
    onSuccess: () => {
      toast.success("Password updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCreateCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCertificate,
    onSuccess: () => {
      toast.success("Certificate added");
      qc.invalidateQueries({ queryKey: miscKeys.certificates });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      serverName,
      certType,
      certSubType,
    }: {
      serverName: string;
      certType: string;
      certSubType?: string;
    }) => deleteCertificate(serverName, certType, certSubType),
    onSuccess: () => {
      toast.success("Certificate removed");
      qc.invalidateQueries({ queryKey: miscKeys.certificates });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCreateGpgKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createGpgKey,
    onSuccess: () => {
      toast.success("GPG key imported");
      qc.invalidateQueries({ queryKey: miscKeys.gpgKeys });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteGpgKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteGpgKey,
    onSuccess: () => {
      toast.success("GPG key removed");
      qc.invalidateQueries({ queryKey: miscKeys.gpgKeys });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
