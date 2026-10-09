import { useState, useMemo } from "react";
import { App, Button, Input, Modal, Tag } from "antd";
import {
  LuCheck,
  LuCopy,
  LuDownload,
  LuFileCheck,
  LuFileDown,
  LuFileText,
  LuSearch,
  LuSparkles,
  LuEye,
  LuArrowRight,
} from "react-icons/lu";

import LearningCategoryCard, {
  learningCardPalette,
  learningCardPatterns,
} from "./LearningCategoryCard.jsx";
import {
  officeTemplateCategories,
  officeTemplates,
} from "../data/officeTemplatesData.js";

export default function OfficeTemplatesHub() {
  const { message } = App.useApp();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [copied, setCopied] = useState(false);

  const filteredTemplates = useMemo(() => {
    return officeTemplates.filter((tpl) => {
      const matchesCategory =
        selectedCategory === "all" || tpl.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        tpl.title.toLowerCase().includes(query) ||
        tpl.titleKhmer.toLowerCase().includes(query) ||
        tpl.description.toLowerCase().includes(query) ||
        tpl.descriptionKhmer.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  function handleCopy(text) {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    message.success("បានចម្លងគំរូអត្ថបទជោគជ័យ! (Copied to Clipboard)");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadTxt(tpl) {
    const element = document.createElement("a");
    const file = new Blob([tpl.contentKhmer], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `${tpl.id}_${tpl.title.toLowerCase().replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    message.success(`បានទាញយកឯកសារ ${element.download}`);
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Input
            size="large"
            prefix={<LuSearch className="text-slate-400 mr-1" />}
            placeholder="ស្វែងរកគំរូឯកសារ (Search permission letters, CV, invoices...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            className="rounded-xl border font-medium"
          />
        </div>
        <div className="text-xs font-bold text-slate-500 self-end md:self-auto">
          {filteredTemplates.length} គំរូឯកសារស្តង់ដារ (Standard Templates)
        </div>
      </div>

      {/* Templates Grid using LearningCategoryCard */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredTemplates.map((tpl, index) => {
          const color = learningCardPalette[(index + 2) % learningCardPalette.length];

          const footer = (
            <Button
              type="primary"
              onClick={() => setPreviewTemplate(tpl)}
              className="w-full h-10 flex items-center justify-center gap-2 font-bold text-sm bg-[#52c41a] hover:!bg-[#46aa16] border-0 rounded-xl shadow-sm hover:shadow transition-all"
            >
              <span>Preview & Use Template</span>
              <LuArrowRight size={15} />
            </Button>
          );

          return (
            <LearningCategoryCard
              accent={color.accent}
              badge={`TEMPLATE 0${index + 1}`}
              deep={color.deep}
              description={tpl.descriptionKhmer}
              footer={footer}
              key={tpl.id}
              pattern={learningCardPatterns[index % learningCardPatterns.length]}
              subtitle={`OFFICE STANDARDS · KHMER UNICODE`}
              title={tpl.titleKhmer}
              visual={<span className="text-4xl">{tpl.icon}</span>}
            >
              <div className="mt-2 flex items-center justify-between text-xs font-bold text-slate-500">
                <span>{tpl.guidelines.length} formatting rules</span>
                <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                  <LuFileCheck size={14} />
                  <span>Ready to Use</span>
                </span>
              </div>
            </LearningCategoryCard>
          );
        })}
      </div>

      {/* Template Detail & Preview Modal */}
      <Modal
        open={!!previewTemplate}
        onCancel={() => setPreviewTemplate(null)}
        footer={null}
        width={760}
        centered
        className="rounded-3xl overflow-hidden"
        title={
          previewTemplate ? (
            <div className="flex items-center gap-3 pt-2">
              <span className="text-3xl p-2 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                {previewTemplate.icon}
              </span>
              <div>
                <div className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                  {previewTemplate.titleKhmer}
                </div>
                <div className="text-xs text-slate-400 font-semibold">
                  {previewTemplate.title}
                </div>
              </div>
            </div>
          ) : null
        }
      >
        {previewTemplate && (
          <div className="space-y-4 pt-3">
            {/* Formatting Guidelines Box */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-950 dark:text-emerald-200 shadow-sm">
              <div className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5 mb-1.5">
                <LuSparkles />
                <span>បទដ្ឋាននៃការកំណត់ទម្រង់ឯកសារ (Formatting Standards):</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 font-medium m-0">
                {previewTemplate.guidelines.map((rule, i) => (
                  <li key={i}>{rule}</li>
                ))}
              </ul>
            </div>

            {/* Template Content Box */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-500">
                  ខ្លឹមសារគំរូឯកសារ (Document Content):
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  អាចកែសម្រួលព័ត៌មានក្នុងសញ្ញា [...] តាមការជាក់ស្តែង
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 max-h-[380px] overflow-y-auto font-mono text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed select-all">
                {previewTemplate.contentKhmer}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <Button
                size="large"
                icon={copied ? <LuCheck /> : <LuCopy />}
                onClick={() => handleCopy(previewTemplate.contentKhmer)}
                className={`flex-1 font-bold h-11 shadow-sm hover:shadow transition-all ${
                  copied
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-slate-900 text-white border-slate-900 hover:!bg-slate-800"
                }`}
              >
                {copied ? "Copied to Clipboard! ✓" : "Copy Template Text (ចម្លងអត្ថបទ)"}
              </Button>

              <Button
                size="large"
                icon={<LuDownload />}
                onClick={() => handleDownloadTxt(previewTemplate)}
                className="flex-1 font-bold h-11 border border-slate-300 dark:border-slate-700 hover:border-slate-400 shadow-sm hover:shadow transition-all"
              >
                Download (.txt file)
              </Button>

              <Button
                size="large"
                onClick={() => setPreviewTemplate(null)}
                className="font-bold h-11"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
