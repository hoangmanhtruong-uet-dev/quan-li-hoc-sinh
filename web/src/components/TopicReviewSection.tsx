"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  Upload,
  FileText,
  Download,
  CheckCircle2,
  RotateCcw,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import {
  ReviewTopic,
  ReviewTopicFile,
  fetchReviewTopics,
  createReviewTopic,
  updateReviewTopic,
  deleteReviewTopic,
  addReviewTopicFile,
  deleteReviewTopicFile,
} from "@/lib/db";

interface Student {
  id: string;
  name: string;
  subject: string;
  grade: string;
}

interface TopicReviewSectionProps {
  students: Student[];
  readOnly?: boolean;
  studentId?: string; // For parent portal: only show topics for this student
}

export function TopicReviewSection({ students, readOnly = false, studentId }: TopicReviewSectionProps) {
  const [topics, setTopics] = useState<ReviewTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);

  // Create/Edit modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState<ReviewTopic | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStudentId, setFormStudentId] = useState("");
  const [saving, setSaving] = useState(false);

  // File upload
  const [uploadingTopicId, setUploadingTopicId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete confirm
  const [deletingTopicId, setDeletingTopicId] = useState<string | null>(null);

  const loadTopics = useCallback(async () => {
    setLoading(true);
    const ids = studentId ? [studentId] : students.map((s) => s.id);
    const data = await fetchReviewTopics(ids);
    setTopics(data);
    setLoading(false);
  }, [students, studentId]);

  useEffect(() => {
    if (students.length > 0 || studentId) {
      loadTopics();
    } else {
      setLoading(false);
    }
  }, [loadTopics, students.length, studentId]);

  // Filtered topics
  const filteredTopics = topics.filter((t) => {
    if (selectedStudent !== "all" && t.student_id !== selectedStudent) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const studentName = students.find((s) => s.id === t.student_id)?.name || "";
      if (!t.title.toLowerCase().includes(q) && !studentName.toLowerCase().includes(q) && !(t.description || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // ---- HANDLERS ----

  const handleOpenCreate = () => {
    setEditingTopic(null);
    setFormTitle("");
    setFormDescription("");
    setFormStudentId(studentId || students[0]?.id || "");
    setShowCreateModal(true);
  };

  const handleOpenEdit = (topic: ReviewTopic) => {
    setEditingTopic(topic);
    setFormTitle(topic.title);
    setFormDescription(topic.description || "");
    setFormStudentId(topic.student_id);
    setShowCreateModal(true);
  };

  const handleSaveTopic = async () => {
    if (!formTitle.trim() || !formStudentId) return;
    setSaving(true);
    if (editingTopic) {
      const ok = await updateReviewTopic(editingTopic.id, { title: formTitle.trim(), description: formDescription.trim() || undefined });
      if (ok) {
        setTopics((prev) => prev.map((t) => (t.id === editingTopic.id ? { ...t, title: formTitle.trim(), description: formDescription.trim() || null } : t)));
      }
    } else {
      const newTopic = await createReviewTopic({ student_id: formStudentId, title: formTitle.trim(), description: formDescription.trim() || undefined });
      if (newTopic) {
        setTopics((prev) => [newTopic, ...prev]);
      }
    }
    setSaving(false);
    setShowCreateModal(false);
  };

  const handleToggleStatus = async (topic: ReviewTopic) => {
    const newStatus = topic.status === "active" ? "completed" : "active";
    const ok = await updateReviewTopic(topic.id, { status: newStatus });
    if (ok) {
      setTopics((prev) => prev.map((t) => (t.id === topic.id ? { ...t, status: newStatus as any } : t)));
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    const ok = await deleteReviewTopic(topicId);
    if (ok) {
      setTopics((prev) => prev.filter((t) => t.id !== topicId));
      setDeletingTopicId(null);
    }
  };

  const handleFileUpload = async (topicId: string, files: FileList) => {
    setUploadingTopicId(topicId);
    for (const file of Array.from(files)) {
      const fileSize = file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(0)} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      let fileUrl = "";

      try {
        const filePath = `review-topics/${topicId}/${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage.from("homework-files").upload(filePath, file);
        if (!uploadErr && uploadData) {
          const { data: urlData } = supabase.storage.from("homework-files").getPublicUrl(filePath);
          fileUrl = urlData.publicUrl;
        } else {
          console.warn("Storage upload failed, falling back to local object URL:", uploadErr?.message);
          fileUrl = URL.createObjectURL(file);
        }
      } catch {
        fileUrl = URL.createObjectURL(file);
      }

      const newFile = await addReviewTopicFile(topicId, {
        file_name: file.name,
        file_url: fileUrl,
        file_size: fileSize,
      });
      if (newFile) {
        setTopics((prev) =>
          prev.map((t) => (t.id === topicId ? { ...t, files: [...(t.files || []), newFile] } : t))
        );
      }
    }
    setUploadingTopicId(null);
  };

  const handleDeleteFile = async (topicId: string, fileId: string) => {
    const ok = await deleteReviewTopicFile(fileId);
    if (ok) {
      setTopics((prev) =>
        prev.map((t) => (t.id === topicId ? { ...t, files: (t.files || []).filter((f) => f.id !== fileId) } : t))
      );
    }
  };

  const getStudentName = (sid: string) => students.find((s) => s.id === sid)?.name || "Học sinh";
  const getStudentSubject = (sid: string) => students.find((s) => s.id === sid)?.subject || "";

  const activeCount = topics.filter((t) => t.status === "active").length;
  const completedCount = topics.filter((t) => t.status === "completed").length;

  // ---- RENDER ----

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mr-3" />
        <span className="text-slate-400 text-sm">Đang tải chủ đề ôn tập...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass rounded-xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span className="text-xs text-slate-400">Tổng chủ đề</span>
          </div>
          <p className="text-2xl font-bold text-white">{topics.length}</p>
        </div>
        <div className="glass rounded-xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-1">
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-400">Đang ôn tập</span>
          </div>
          <p className="text-2xl font-bold text-amber-300">{activeCount}</p>
        </div>
        <div className="glass rounded-xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-400">Hoàn thành</span>
          </div>
          <p className="text-2xl font-bold text-emerald-300">{completedCount}</p>
        </div>
        <div className="glass rounded-xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-400">Tài liệu</span>
          </div>
          <p className="text-2xl font-bold text-cyan-300">{topics.reduce((sum, t) => sum + (t.files?.length || 0), 0)}</p>
        </div>
      </div>

      {/* Filters + Actions Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Student filter */}
          {!studentId && students.length > 1 && (
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
            >
              <option value="all">Tất cả học sinh</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} - {s.subject}
                </option>
              ))}
            </select>
          )}

          {/* Status filter pills */}
          {[
            { key: "all", label: "Tất cả", icon: BookOpen },
            { key: "active", label: "Đang ôn", icon: RotateCcw },
            { key: "completed", label: "Hoàn thành", icon: CheckCircle2 },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all",
                statusFilter === f.key
                  ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                  : "bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10 border border-transparent"
              )}
            >
              <f.icon className="w-3.5 h-3.5" />
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 items-center w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 md:w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm chủ đề..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          {/* Create button */}
          {!readOnly && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/20 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm chủ đề
            </button>
          )}
        </div>
      </div>

      {/* Topics List */}
      {filteredTopics.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-400 mb-1">
            {topics.length === 0 ? "Chưa có chủ đề ôn tập nào" : "Không tìm thấy chủ đề"}
          </h3>
          <p className="text-xs text-slate-500">
            {topics.length === 0 && !readOnly ? "Nhấn \"Thêm chủ đề\" để tạo chủ đề ôn tập mới cho học sinh." : "Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTopics.map((topic) => {
            const isExpanded = expandedTopicId === topic.id;
            const studentName = getStudentName(topic.student_id);
            const studentSubject = getStudentSubject(topic.student_id);
            const files = topic.files || [];

            return (
              <div
                key={topic.id}
                className={cn(
                  "glass rounded-xl border transition-all",
                  topic.status === "completed" ? "border-emerald-500/20 bg-emerald-500/5" : "border-white/5",
                  isExpanded && "ring-1 ring-indigo-500/30"
                )}
              >
                {/* Topic Header */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer"
                  onClick={() => setExpandedTopicId(isExpanded ? null : topic.id)}
                >
                  {/* Status indicator */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!readOnly) handleToggleStatus(topic);
                    }}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition",
                      topic.status === "completed"
                        ? "bg-emerald-500 border-emerald-400"
                        : "border-slate-600 hover:border-indigo-400",
                      readOnly && "cursor-default"
                    )}
                  >
                    {topic.status === "completed" && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </button>

                  {/* Title + meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className={cn(
                          "font-semibold text-sm",
                          topic.status === "completed" ? "text-slate-400 line-through" : "text-white"
                        )}
                      >
                        {topic.title}
                      </h3>
                      <span
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                          topic.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        )}
                      >
                        {topic.status === "completed" ? "Hoàn thành" : "Đang ôn"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] text-slate-500">
                        👤 {studentName} {studentSubject && `• ${studentSubject}`}
                      </span>
                      {files.length > 0 && (
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <FileText className="w-3 h-3" /> {files.length} tài liệu
                        </span>
                      )}
                      <span className="text-[11px] text-slate-600">
                        {new Date(topic.created_at).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {!readOnly && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(topic);
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
                          title="Sửa"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingTopicId(topic.id);
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition"
                          title="Xoá"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                    {/* Description */}
                    {topic.description && (
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-xs text-slate-300 whitespace-pre-wrap">{topic.description}</p>
                      </div>
                    )}

                    {/* Files */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tài liệu đính kèm</h4>
                        {!readOnly && (
                          <button
                            onClick={() => {
                              setUploadingTopicId(topic.id);
                              fileInputRef.current?.click();
                            }}
                            disabled={uploadingTopicId === topic.id}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-[11px] font-semibold transition disabled:opacity-50"
                          >
                            {uploadingTopicId === topic.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Upload className="w-3 h-3" />
                            )}
                            Tải file lên
                          </button>
                        )}
                      </div>

                      {files.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">Chưa có tài liệu nào.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {files.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 group"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-white truncate">{file.file_name}</p>
                                  {file.file_size && (
                                    <p className="text-[10px] text-slate-500">{file.file_size}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <a
                                  href={file.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-cyan-300 transition"
                                  title="Tải xuống"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                                {!readOnly && (
                                  <button
                                    onClick={() => handleDeleteFile(topic.id, file.id)}
                                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                                    title="Xoá file"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Delete Confirmation */}
                {deletingTopicId === topic.id && (
                  <div className="px-4 pb-4">
                    <div className="bg-red-950/40 border border-red-500/20 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <span className="text-xs text-red-300">Xoá chủ đề "{topic.title}" và tất cả tài liệu?</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteTopic(topic.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition"
                        >
                          Xoá
                        </button>
                        <button
                          onClick={() => setDeletingTopicId(null)}
                          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-medium transition"
                        >
                          Huỷ
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0 && uploadingTopicId) {
            handleFileUpload(uploadingTopicId, e.target.files);
          }
          e.target.value = "";
        }}
      />

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h3 className="text-lg font-bold text-white">
                {editingTopic ? "Sửa chủ đề ôn tập" : "Thêm chủ đề ôn tập mới"}
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Student selector */}
              {!studentId && !editingTopic && (
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">Học sinh</label>
                  <select
                    value={formStudentId}
                    onChange={(e) => setFormStudentId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} - {s.subject} ({s.grade})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Tên chủ đề *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="VD: Phương trình bậc 2, Hàm số bậc nhất..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Mô tả / Ghi chú</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ghi chú nội dung ôn tập, yêu cầu đặc biệt..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 p-5 border-t border-white/5">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium transition"
              >
                Huỷ
              </button>
              <button
                onClick={handleSaveTopic}
                disabled={!formTitle.trim() || saving}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingTopic ? "Cập nhật" : "Tạo chủ đề"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}