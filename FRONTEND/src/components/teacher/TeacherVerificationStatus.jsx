import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const statusStyles = {
  Verified: {
    badge: "bg-emerald-100 text-emerald-700",
    border: "border-emerald-200",
  },
  Pending: {
    badge: "bg-amber-100 text-amber-700",
    border: "border-amber-200",
  },
  Rejected: {
    badge: "bg-rose-100 text-rose-700",
    border: "border-rose-200",
  },
  NotSubmitted: {
    badge: "bg-slate-100 text-slate-700",
    border: "border-slate-200",
  },
};

const statusMessageMap = {
  Verified: "Verification completed. You can access all teacher tools.",
  Pending: "Verification is not done yet. Your details are under review.",
  Rejected:
    "Verification was rejected. Please update and resubmit your details.",
  NotSubmitted: "Verification is not done yet. Please submit your details.",
};

const TeacherVerificationStatus = () => {
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  const fetchVerificationStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BACKEND_URL}/teacher/verification/status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        setVerificationData(data.data);
      }
    } catch (error) {
      console.error("Error fetching verification status:", error);
    } finally {
      setLoading(false);
    }
  }, [BACKEND_URL]);

  useEffect(() => {
    fetchVerificationStatus();
  }, [fetchVerificationStatus]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Loading verification status...</p>
      </div>
    );
  }

  const status =
    verificationData?.verificationStatus &&
    statusStyles[verificationData.verificationStatus]
      ? verificationData.verificationStatus
      : "NotSubmitted";
  const styles = statusStyles[status];
  const message = statusMessageMap[status];
  const isVerified = status === "Verified";

  return (
    <div
      className={`rounded-2xl border bg-white p-6 shadow-sm ${styles.border}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Verification Status
          </h3>
          <p className="text-sm text-slate-600">{message}</p>
        </div>
        <span
          className={`rounded-full px-4 py-1 text-sm font-semibold ${styles.badge}`}
        >
          {status}
        </span>
      </div>

      {verificationData?.verificationNotes && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Admin Feedback
          </p>
          <p className="mt-2 text-sm text-slate-700">
            {verificationData.verificationNotes}
          </p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        {!isVerified && (
          <button
            type="button"
            onClick={() => navigate("/teacher/upload-qualification")}
            className="rounded-full bg-purple-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
          >
            Complete verification
          </button>
        )}
        <button
          type="button"
          onClick={() => navigate("/teacher/upload-qualification")}
          className="rounded-full border border-purple-200 px-5 py-2 text-sm font-semibold text-purple-700 transition hover:border-purple-400"
        >
          View details
        </button>
      </div>
    </div>
  );
};

export default TeacherVerificationStatus;
