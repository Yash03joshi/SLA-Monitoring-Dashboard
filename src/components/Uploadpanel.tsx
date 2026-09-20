"use client";

import { useCallback, useRef, useState } from "react";
import { UploadResponse } from "../types/Monitoring";
import { uploadCsv } from "../lib/api";

export default function UploadPanel({
  onUploaded,
}: {
  onUploaded: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = useCallback((f: File | null) => {
    setResult(null);
    setShowErrors(false);
    setFile(f);
  }, []);

  async function handleSubmit() {
    if (!file) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await uploadCsv(file);
      setResult(res);
      if (res.success) onUploaded();
    } catch {
      setResult({
        success: false,
        error: "Upload failed — check your connection and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="border border-[#DEE3E1] bg-white p-5">
      <h2 className="text-sm font-semibold tracking-tight text-[#131718]">
        Upload check log
      </h2>
      <p className="mt-1 text-xs text-[#5B6663]">
        A CSV of health-check rows, one check per row. Uploads are parsed and
        cleaned in a serverless function, then written to the database.
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          const dropped = e.dataTransfer.files?.[0];
          if (dropped) pickFile(dropped);
        }}
        onClick={() => inputRef.current?.click()}
        className={`mt-4 flex cursor-pointer items-center justify-between border border-dashed px-4 py-4 text-sm transition-colors ${
          dragActive ? "border-[#0E7C7B] bg-[#0E7C7B]/5" : "border-[#C7CDCA]"
        }`}
      >
        <span className="text-[#5B6663]">
          {file ? (
            <span className="font-mono text-[#131718]">{file.name}</span>
          ) : (
            "Drop a .csv file here, or click to browse"
          )}
        </span>
        <span className="text-xs font-medium text-[#0E7C7B]">Browse</span>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={!file || submitting}
          className="border border-[#131718] bg-[#131718] px-4 py-2 text-xs font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Processing…" : "Upload and process"}
        </button>
        {file && !submitting && (
          <button
            onClick={() => pickFile(null)}
            className="text-xs text-[#5B6663] underline underline-offset-2"
          >
            Clear
          </button>
        )}
      </div>

      {result && !result.success && (
        <p className="mt-4 border-l-2 border-[#C24444] pl-3 text-xs text-[#C24444]">
          {result.error ?? "Upload failed."}
        </p>
      )}

      {result?.success && result.summary && (
        <div className="mt-4 border-t border-[#E3E6E4] pt-4">
          <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-[#131718]">
            <span>
              rows <b>{result.summary.totalRows}</b>
            </span>
            <span className="text-[#0E7C7B]">
              inserted <b>{result.summary.insertedRows}</b>
            </span>
            <span
              className={
                result.summary.rejectedRows > 0
                  ? "text-[#C24444]"
                  : "text-[#5B6663]"
              }
            >
              rejected <b>{result.summary.rejectedRows}</b>
            </span>
            <span>
              services <b>{result.summary.services}</b>
            </span>
          </div>

          {result.errors && result.errors.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setShowErrors((v) => !v)}
                className="text-xs font-medium text-[#0E7C7B] underline underline-offset-2"
              >
                {showErrors ? "Hide" : "View"} {result.errors.length} rejected
                row
                {result.errors.length === 1 ? "" : "s"}
              </button>
              {showErrors && (
                <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto border border-[#E3E6E4] bg-[#F4F6F7] p-3 font-mono text-[11px] text-[#5B6663]">
                  {result.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
