import React from "react";
import "./ReportAnalytics.css";
import { useTranslation } from "react-i18next";

export default function ReportAnalytics({ variant, title, value }) {
  const { t } = useTranslation();

  return (
    <div className={`ReportAnalytics_card variant_${variant}`}>
      <div className="ReportAnalytics_card_content">
        <p className="vl-heading f-400">{t(title)}</p>
        <h1 className="vl-title f-700">{value || "0"}</h1>
      </div>
    </div>
  );
}
