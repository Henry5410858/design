"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  enhanceImage,
  enhanceImagesBatch,
  getEnhanceUsage,
  type EnhancementPreset,
  type EnhanceResponse,
} from "@/src/utils/premium";
import { useAuth } from "@/src/context/AuthContext";
import { 
  MagicWand, 
  Image as ImageIcon, 
  ArrowsClockwise,
  ArrowCounterClockwise,
  DownloadSimple,
  ImagesSquare,
  Lightning,
} from "phosphor-react";

// Simple helper to get auth token client-side
function useToken() {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, []);
  return token;
}

type ImageItem = {
  id: string;
  name: string;
  // Original
  originalSrc: string; // object URL
  file?: File; // present if uploaded by file
  originalPublicId?: string;
  originalUrl?: string;
  // Enhanced
  enhancedSrc?: string; // final URL from backend (Cloudinary)
  enhancedPublicId?: string;
  cached?: boolean;
  preset?: EnhancementPreset;
  // State
  status: "idle" | "enhancing" | "done" | "error";
  error?: string;
};

export default function AIEnhancePage() {
  const token = useToken();
  const { user } = useAuth();

  const [items, setItems] = useState<ImageItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [preset, setPreset] = useState<EnhancementPreset>("standard");
  const [enhancingAll, setEnhancingAll] = useState(false);
  const [usage, setUsage] = useState<{ month: string; count: number; quota: number } | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load usage on mount and after enhancements
  const refreshUsage = useCallback(async () => {
    try {
      if (!token) return;
      const data = await getEnhanceUsage(token);
      setUsage(data);
    } catch {
      // ignore for now in testing mode
    }
  }, [token]);

  useEffect(() => {
    refreshUsage();
  }, [refreshUsage]);

  const onFilesSelected = useCallback((files: FileList | File[]) => {
    const next: ImageItem[] = [];
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const url = URL.createObjectURL(file);
      next.push({
        id,
        name: file.name,
        originalSrc: url,
        file,
        status: "idle",
      });
    });
    if (next.length) setItems((prev) => [...next, ...prev]);
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length) onFilesSelected(files);
    if (fileInputRef.current) fileInputRef.current.value = ""; // reset
  }, [onFilesSelected]);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const dt = e.dataTransfer;
    if (dt?.files && dt.files.length) onFilesSelected(dt.files);
  }, [onFilesSelected]);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => setDragOver(false), []);

  const enhanceOne = useCallback(async (id: string) => {
    if (!token) return;
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: "enhancing", error: undefined } : it)));
    const item = items.find((i) => i.id === id);
    if (!item) return;
    try {
      const resp: EnhanceResponse = await enhanceImage(item.file ?? item.originalSrc, token, preset);
      setItems((prev) => prev.map((it) => 
        it.id === id
          ? {
              ...it,
              status: "done",
              enhancedSrc: resp.url,
              enhancedPublicId: resp.publicId,
              originalPublicId: resp.originalPublicId ?? it.originalPublicId,
              originalUrl: resp.originalUrl ?? it.originalUrl,
              cached: resp.cached,
              preset: resp.preset ?? preset,
            }
          : it
      ));
      refreshUsage();
    } catch (e: any) {
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: "error", error: e?.message || "Enhance failed" } : it)));
    }
  }, [items, token, preset, refreshUsage]);

  const enhanceAll = useCallback(async () => {
    if (!token) return;
    setEnhancingAll(true);
    try {
      // Enhance only those not done yet
      const pending = items.filter((i) => i.status !== "done");
      // Mark all pending as enhancing
      setItems((prev) => prev.map((it) => (it.status !== "done" ? { ...it, status: "enhancing", error: undefined } : it)));

      // Sequential to reduce spikes
      for (const it of pending) {
        try {
          const resp = await enhanceImage(it.file ?? it.originalSrc, token, preset);
          setItems((prev) => prev.map((x) =>
            x.id === it.id
              ? {
                  ...x,
                  status: "done",
                  enhancedSrc: resp.url,
                  enhancedPublicId: resp.publicId,
                  originalPublicId: resp.originalPublicId ?? x.originalPublicId,
                  originalUrl: resp.originalUrl ?? x.originalUrl,
                  cached: resp.cached,
                  preset: resp.preset ?? preset,
                }
              : x
          ));
        } catch (e: any) {
          setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, status: "error", error: e?.message || "Enhance failed" } : x)));
        }
      }
      refreshUsage();
    } finally {
      setEnhancingAll(false);
    }
  }, [items, token, preset, refreshUsage]);

  const revertOne = useCallback((id: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, enhancedSrc: undefined, status: "idle", cached: false } : it)));
  }, []);

  const downloadEnhanced = useCallback((url?: string, name?: string) => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = name ? `enhanced_${name}` : "enhanced_image";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  const usageLabel = useMemo(() => {
    if (!usage) return "";
    return `Este mes: ${usage.count}/${usage.quota}`;
  }, [usage]);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-2xl mb-6 shadow-lg">
            <MagicWand size={32} className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mejora de Imágenes con IA</h1>
          <p className="text-gray-600">Arrastra y suelta varias imágenes, mejora una por una o todas a la vez.</p>
        </div>

        {/* Controls Row */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-soft mb-6 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700">Preset</label>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value as EnhancementPreset)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="standard">Standard</option>
              <option value="vivid">Vivid</option>
              <option value="soft">Soft</option>
            </select>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2"
            >
              <ImagesSquare size={18} /> Añadir Imágenes
            </button>
            <button
              onClick={enhanceAll}
              disabled={enhancingAll || !items.length}
              className="px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-xl font-medium hover:from-brand-primary-dark hover:to-brand-secondary-dark transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
            >
              <Lightning size={18} /> {enhancingAll ? "Mejorando..." : "Mejorar Todas"}
            </button>
          </div>
        </div>

        {/* Usage */}
        {usage && (
          <div className="mb-4 text-right text-sm text-gray-600">{usageLabel}</div>
        )}

        {/* Drag & Drop Zone */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`mb-8 rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
            dragOver ? "border-brand-primary bg-brand-primary/5" : "border-gray-300"
          }`}
        >
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <ImageIcon size={32} className="text-brand-primary" />
            </div>
            <p className="text-gray-700 font-medium">Arrastra tus imágenes aquí</p>
            <p className="text-gray-500 text-sm">o haz clic en "Añadir Imágenes"</p>
          </div>
        </div>

        {/* Images Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-200 shadow-soft overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div className="text-sm font-medium text-gray-900 truncate" title={item.name}>{item.name}</div>
                <div className="text-xs text-gray-500">{item.preset ?? preset}{item.cached ? " • cache" : ""}</div>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Original</div>
                    <img src={item.originalSrc} alt="original" className="w-full h-40 object-cover rounded-lg border" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Mejorada</div>
                    {item.status === "enhancing" ? (
                      <div className="w-full h-40 bg-gray-100 rounded-lg border flex items-center justify-center">
                        <ArrowsClockwise className="animate-spin text-brand-primary" size={24} />
                      </div>
                    ) : item.enhancedSrc ? (
                      <img src={item.enhancedSrc} alt="enhanced" className="w-full h-40 object-cover rounded-lg border" />
                    ) : (
                      <div className="w-full h-40 bg-gray-50 rounded-lg border flex items-center justify-center text-gray-400 text-sm">
                        Resultado de IA aquí
                      </div>
                    )}
                  </div>
                </div>

                {item.error && (
                  <div className="text-xs text-red-600">{item.error}</div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => enhanceOne(item.id)}
                    disabled={item.status === "enhancing"}
                    className="px-3 py-2 bg-brand-primary text-white rounded-lg text-sm hover:bg-brand-primary-dark disabled:opacity-50 flex items-center gap-2"
                  >
                    <MagicWand size={16} /> {item.status === "enhancing" ? "Mejorando..." : "Mejorar"}
                  </button>
                  <button
                    onClick={() => revertOne(item.id)}
                    disabled={!item.enhancedSrc}
                    className="px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
                  >
                    <ArrowCounterClockwise size={16} /> Revertir
                  </button>
                  <button
                    onClick={() => downloadEnhanced(item.enhancedSrc, item.name)}
                    disabled={!item.enhancedSrc}
                    className="ml-auto px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
                  >
                    <DownloadSimple size={16} /> Descargar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}